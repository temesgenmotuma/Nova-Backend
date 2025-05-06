import db from "../Db/db";
import { nonResEntryType } from "../Controllers/entryExit.controller";
import ModelError from "./ModelError";

const entryExitModel = {
  async findNonReservationSpot(lotId: string | undefined) {
    //TODO: test the first path
    //TODO: What should the value of the status below be??????
    const spotWithNoReservations = await db.spot.findFirst({
      where: {
        status: "Reserved",
        lotId,
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
            WHERE
              s."lotId" = ${lotId} 
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
           "startTime" = ( 
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
    if(!ticket) throw new ModelError("Ticket not found", 404);
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
    const reservation = await db.reservation.findFirst({
      where: {
        licensePlate,
        status: "ACTIVE",
        spot: {
          lotId: lotId,
        },
      },
      include: {
        vehicle: {
          select: {
            id: true,
          },
        },
      },
    });

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
            id: true,
          },
        },
      },
    });
    if (ticket.length === 0) throw new ModelError("Ticket not found", 404);
    if (ticket.length > 1)
      throw new ModelError(
        "Internal server error: More than 1 ticket for one phone",
        500
      );

    await db.entryTicket.updateMany({
      where: {
        phoneNumber: phone,
      },
      data: {
        status: "COMPLETED",
      },
    });


    //update reservation status
    await db.reservation.update({
      where:{
        id: ticket[0].vehicle.id,
      },
      data: {
        status: "COMPLETE",
      }
    })
    //check if an active ticket exists
    //update the ticket
    //update the spot
  },
};

export default entryExitModel;

