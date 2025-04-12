import db from "../Db/db";
import reservationModel from "./reservation.model";

const entryExitModel = {
    async nonReservationEntry(){
        // const ticket = await db.entryTicket.create({
        //     data:{ 
        //      }   
        // });
    },

    async findNonReservationSpot(lotId:string | undefined){
  
      /* const spotWithNoReservations = await db.spot.findFirst({
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
        });

        if (spotWithNoReservations) {
            return spotWithNoReservations;
        } */

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
        const now = new Date();

        const furthestReservationSpot = await db.$queryRaw`
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
              --r."startTime" >= ${now}
            GROUP BY s.id, s.name, s.floor
          )
           SELECT 
            s.name,  
            r."startTime" --to check
           FROM "Reservation" r 
           JOIN "Spot" s ON s.id=r."spotId"
           WHERE 
            "startTime" = ( 
                  SELECT MAX("startTime") 
                  FROM "furthestResOfEachSpot"
            )
           --AND


        `;
        return furthestReservationSpot;
    },

    async assignSpot(lotId: string, entryTime: Date) {
        // const freeSpots = await reservationModel.checkAvailability( );
    }
};

export default entryExitModel;