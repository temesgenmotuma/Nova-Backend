import db from "../Db/db";
import { nonResEntryType } from "../Controllers/entryExit.controller";
import ModelError from "./ModelError";

const entryExitModel = {
  async findNonReservationSpot(lotId: string | undefined, zoneId: string) {
    //TODO: test the first path
    //TODO: What should the value of the status below be??????
    //add status: not occupied
    const spotWithNoReservations = await db.spot.findFirst({
      where: {
        // status: "Reserved",
        zoneId,
        // zone: {
        //   lotId,
        // },
        OR: [
          {
            reservations: {
              none: {},
            },
          },
          {
            //no reservation starts or ends at any time after now
            reservations: {
              none: {
                OR: [
                  {
                    startTime: {
                      gte: new Date(),
                    },
                  },
                  {
                    endTime: {
                      gte: new Date(),
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        floor: true,
      },
    });

    if (spotWithNoReservations) {
      return spotWithNoReservations;
    }

    const now = new Date();
    type spot = {
      id: string;
      name: string;
      floor: number;
      startTime: Date;
    };

    const furthestReservationSpot = await db.$queryRaw<spot[]>`
      WITH "furthestResOfEachSpot" AS (
        SELECT 
          s.id "spotId" , 
          s.name "spotName", 
          s.floor floor, 
          MAX(r."startTime") "startTime" 
        FROM "Reservation" r
        JOIN "Spot" s ON r."spotId"=s.id 
        JOIN "Zone" z ON s."zoneId"=z.id
        WHERE
          s."zoneId" = ${zoneId}
          z."lotId" = ${lotId} 
          r."startTime" >= ${now}
          r."Status" != 'CANCELLED'
        GROUP BY s.id, s.name, s.floor
      )
      SELECT 
       s.id,
       s.name,
       s.floor,  
       r."startTime" --to check
      FROM "Reservation" r 
      JOIN "Spot" s ON s.id=r."spotId"
      WHERE 
       r."startTime" = ( 
             SELECT MAX("startTime") 
             FROM "furthestResOfEachSpot"
       )
      AND
       r."startTime" >= ${now}
    `;
    return furthestReservationSpot[0];
  },

  async nonReservationEntry( spotId: string, lotId: string | undefined, reqObj: nonResEntryType) {
    const { licensePlate, phoneNumber, vehicle } = reqObj;
    //TODO:There should be some check on the time that has passed since the reservation start time.
    //TODO:Should license plate filter be here??
    const activeTicket = await db.entryTicket.findFirst({
      where: {
        phoneNumber,
        status:"ACTIVE",
        licensePlate,
      },
    });

    //TODO: Test this case
    if (activeTicket) {
      throw new ModelError(
        "There is an existing active ticket with this phone number",
        409
      );
    }

    const ticket = await db.$transaction(async (tx) => {
      const newVehicle = await db.vehicle.upsert({
        where: {
          licensePlateNumber: licensePlate,
        },
        update: {},
        create: {
          licensePlateNumber: licensePlate,
        },
      });

      const newTicket = await tx.entryTicket.create({
        data: {
          spotId,
          entryTime: new Date(),
          licensePlate: licensePlate,
          phoneNumber,
          vehicleId: newVehicle.id,
        },
        omit:{
          createdAt: true,
          updatedAt: true,
        }
      });

      await tx.spot.update({
        where: {
          id: spotId,
        },
        data: {
          status: "Occupied",
          occupationType: "NONRESERVATION",
        },
      });
      return newTicket;
    
    });
    return ticket;
  },

  async nonReservationExit( lotId: string, phone: string){
    //check if an active ticket exists
    const ticket = await db.entryTicket.findFirst({
      where: {
        phoneNumber: phone,
        status: "ACTIVE",
        spot:{
          zone:{
            lot:{
              id: lotId,
            },
          },
        }
      },
    });
    if(!ticket) throw new ModelError("No active ticket found", 404);
    // if(!ticket.isPaid) throw new ModelError("Payment not done", 403);
    
    //update spot status
    //update ticket status
    return await db.$transaction([
      db.spot.update({
        where: {
          id: ticket.spotId,
        },
        data: {
          status: "Available",
          occupationType: null,
        },
      }),
      db.entryTicket.update({
        where: {
          id: ticket.id,
        },
        data: {
          exitTime: new Date(),
          status: "COMPLETED",
        },
      }),
      //calculate the price
      //make sure payment is done 
    ]);
  },

  async reservationEntry(licensePlate: string, phone:string, lotId: string) {
    const existingTicket = await db.entryTicket.findFirst({
      where: {
        phoneNumber: phone,
        status: "ACTIVE",
        licensePlate: licensePlate,
      },
    });

    if (existingTicket) {
      throw new ModelError(
        "There is an existing active ticket with this phone number",
        409
      );
    }
    
    const reservation = await db.reservation.findFirst({
      where: {
        licensePlate,
        status: "ACTIVE",
        spot: {
          zone: {
            lotId: lotId,
          },
        },
      },
      include: {
        vehicle: {
          select: {
            id: true,
          },
        },
        spot: {
          include: {
            zone: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    //TODO: Check if there is an existing active ticket for this phone number
    //TODO: Store the reservation id in the ticket

    if(!reservation) throw new ModelError("Reservation not found", 404);
    const ticket = await db.entryTicket.create({
      data: {
        spotId: reservation.spotId,
        entryTime: new Date(),
        licensePlate: reservation.licensePlate,
        phoneNumber: phone,
        vehicleId: reservation.vehicle.id,
      },
    });

    //Should this be here?
    db.spot.update({
      where: {
        id: reservation.spotId,
      },
      data: {
        status: "Occupied",
      },
    });

    return ticket
  },

  async reservationExit(lotId: string, phone: string) {
    //make sure we are not past the reservation end time(some grace time)
    const ticket = await db.entryTicket.findMany({
      where: {
        phoneNumber: phone,
        status: "ACTIVE",
        spot: {
          zone: {
            lot: {
              id: lotId,
            },
          },
        },
      },
      include: {
        vehicle: {
          select: {
            reservations: {
              where: {
                status: "ACTIVE",
                spot: {
                  zone: {
                    lotId: lotId,
                  },
                },
              },
              select: {
                id: true,
              },
            },
            id: true,
          },
        },
      },
    });

    if (ticket.length === 0)
      throw new ModelError("No active ticket found for this vehicle", 404);

    if (ticket.length > 1)
      throw new ModelError(
        "Internal server error: More than 1 ticket for one phone",
        500
      );

    const reservation = ticket[0].vehicle.reservations;
    if (reservation.length > 1) {
      throw new ModelError(
        "Multiple active reservations found for this vehicle",
        500
      );
    }

    await db.$transaction([
      db.entryTicket.updateMany({
        where: {
          phoneNumber: phone,
          status: "ACTIVE",
        },
        data: {
          status: "COMPLETED",
          exitTime: new Date(),
        },
      }),
      db.reservation.update({
        where: {
          id: ticket[0].vehicle.reservations[0].id,
        },
        data: {
          status: "COMPLETE",
          spot:{
            update:{
              status: "Available",
              occupationType: null,
            }
          }
        },
      }),
    ]);
  },
};

export default entryExitModel;

