import db from "../Db/db";
import {vehicleType} from "../Controllers/entryExit.controller";
import { nonResEntryType } from "../Controllers/entryExit.controller";
import ModelError from "./ModelError";

const entryExitModel = {
  async nonReservationEntry(spotId: string, lotId: string |undefined, reqObj: nonResEntryType) {
    const {licensePlate, phoneNumber, vehicle} = reqObj;
    const activeTicket = await db.entryTicket.findFirst({
      where:{
        phoneNumber
      }
    });

    if (activeTicket) {
      throw new ModelError(
        "There is an existing active ticket with this phone number",
        409
      );
    }
    
    /* const newVehicle = await db.vehicle.upsert({
      where: {
        licensePlateNumber: licensePlate,
      },
      update: {},
      create: {
        licensePlateNumber: licensePlate,
        make: "dalkfj",
        model: "dkfja",
        color: "kdajfl",
      },
    });
 */
    await db.$transaction(async (tx) => {
      const ticket = await tx.entryTicket.create({
        data: {
          spotId,
          entryTime: new Date(),
          licensePlate: licensePlate,
          phoneNumber
        },
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

      return ticket;
    });
  },

  async findNonReservationSpot(lotId: string | undefined) {
    //TODO: test the first path
    const spotWithNoReservations = await db.spot.findFirst({
      where: {
        // status: "Available",
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

    type FurthestReservationSpot = {
      id: string;
      name: string;
      floor: number;
      startTime: Date;
    };

    const furthestReservationSpot = await db.$queryRaw<
      FurthestReservationSpot[]
    >`
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

  async assignSpot(lotId: string, entryTime: Date) {
    // const freeSpots = await reservationModel.checkAvailability( );
  },
};

export default entryExitModel;

/* const furthestReservationSpot = await db.reservation.groupBy({
by: 'spotId',
where:{
  reservations:{
    some:{
      startTime:{
        gte: now
      }
    }
  }
}
}); */