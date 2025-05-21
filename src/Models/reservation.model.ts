import db from "../Db/db";
import {
  ReserveQueryType,
} from "../Controllers/reservation.controller";
import ModelError from "./ModelError";

const reservationModel = {
  async checkAvailability(
    lotId: string,
    zoneId: string,
    fromTime: Date,
    toTime: Date
  ) {
    const freeSpot = await db.spot.findFirst({
      where: {
        zoneId,
        zone: {
          lotId,
        },
        status: "Available",
      },
    });

    if (freeSpot) return freeSpot;

    //check if the spot is available during the time the customer wants to reserve
    const fromDateTime = new Date(fromTime).toISOString();
    const toDateTime = new Date(toTime).toISOString();

    const spot = await db.spot.findFirst({
      where: {
        zoneId,
        zone: {
          lotId: lotId,
        },
        OR: [
          {
            reservations: {
              every: {
                status: "ACTIVE", // test this out.
                OR: [
                  {
                    startTime: {
                      gt: toDateTime,
                    },
                  },
                  {
                    endTime: {
                      lt: fromDateTime,
                    },
                  },
                ],
              },
            },
          },
          {
            reservations: {
              none: {},
            },
          },
        ],
      },
    });
    return spot;

    //it is occupied now and occupationType is reservation - reservation can still be made
    //for non-reservation customers priority shoudld be to find a spot that is free now
    //if the spot is occupied and occupationType is nonreservation - no reservation can be made
    /* if(spot?.status !== "Available" && spot?.occupationType === "NONRESERVATION"){
          return null;
        } */
  },
  async reserve(spotId: string, reservation: ReserveQueryType) {
    const result = await db.$transaction(async (tx) => {
      //lock the row
      await tx.$executeRaw`SELECT * FROM "Spot" WHERE id=${spotId} FOR UPDATE;`;

      /* await tx.reservation.create({
            data:{
              startTime: reservation.startTime,
              endTime: reservation.endTime,
              vehicleId: reservation.vehicleId,
              spotId: spotId,
              status: "ACTIVE",   
            },        
          });
     */
      //TODO:payment likely to go in here

      //create a reservation record and update the status in spot to reserved
      const vehicle = await tx.vehicle.findUnique({
        where: {
          id: reservation.vehicleId,
          deletedAt: null,
        },
        select: {
          licensePlateNumber: true,
        },
      });
      if (!vehicle) {
        throw new ModelError("Vehicle not found", 404);
      }

      return await tx.spot.update({
        where: {
          id: spotId,
        },
        data: {
          status: "Reserved",
          occupationType: "RESERVATION",
          reservations: {
            create: {
              startTime: reservation.startTime,
              endTime: reservation.endTime,
              vehicleId: reservation.vehicleId,
              licensePlate: vehicle.licensePlateNumber,
              status: "ACTIVE",
            },
          },
        },
      });
    });
    return result;
  },

  async getReservations(
    providerId: string,
    lotId: string | undefined,
    zoneId: string | undefined,
    from: Date | undefined,
    to: Date | undefined,
    status: string | undefined,
    limit: number,
    offset: number
  ) {

    const fromDate = from ? new Date(from).toISOString() : undefined;
    const toDate = to ? new Date(to).toISOString() : undefined;
    
    let query: any = {};
    if (from && !toDate) {
      query.endTime = {
        gt: fromDate,
      };
    }
    if (toDate && !fromDate) {
      query.startTime = {
        lt: toDate,
      };
    }
    if (fromDate && toDate) {
      query.OR = [
        {
          startTime: {
            gte: fromDate,
            lte: toDate,
          },
        },
        {
          endTime: {
            gte: fromDate,
            lte: toDate,
          },
        },
      ];
    }

    const whereFilter = {
      spot: {
        ...(zoneId && { zoneId: zoneId }),
        zone: {
          ...(lotId && { lotId: lotId }),
          lot: {
            providerId: providerId,
          },
        },
      },
      ...(status && { status: status }),
      ...query,
    };

    const [reservations, count] = await Promise.all([
      await db.reservation.findMany({
        where: whereFilter,
        take: limit,
        skip: offset,
        orderBy: {
          startTime: "asc",
        },
        include: {
          spot: {
            select: {
              id: true,
              name: true,
              floor: true,
              status: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
              color: true,
              licensePlateNumber: true,
              customer: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                },
              },
            },
          },
        },
      }),
      await db.reservation.count({
        where: whereFilter,
      }),
    ]);

    return {count, reservations};
  },

  async cancelReservation(reservationId: string) {
    //free the spot
    //mark the reservation as cancelled
    return await db.reservation.update({
      where: {
        id: reservationId,
        status: "ACTIVE", //only update if the reservation is active
      },
      data: {
        status: "CANCELLED",
        spot: {
          update: {
            status: "Available",
          },
        },
      },
    });
  },

  async getReservationsByVehicle(id: string, customerId: string) {
    return await db.reservation.findMany({
      where: {
        vehicle: {
          id,
          customer: {
            id: customerId,
          },
        },
      },
    });
  },

  async softDeleteExpiredReservations() {
    await db.reservation.updateMany({
      where: {
        endTime: {
          lt: new Date(),
        },
        status: "ACTIVE",
      },
      data: {
        status: "COMPLETE",
      },
    });

    await db.spot.updateMany({
      where: {
        status: {
          not: "Occupied",
        },
        reservations: {
          every: {
            endTime: {
              lt: new Date(),
            },
            status: {
              not: "CANCELLED",
            },
          },
        },
      },
      data: {
        status: "Available",
        occupationType: null,
      },
    });

    await db.entryTicket.updateMany({
      where: {
        spot: {
          occupationType: "RESERVATION",
        },
        exitTime: {
          not: null,
        },
      },
      data: {
        status: "COMPLETED",
      },
    });
  },
};

export default reservationModel;
