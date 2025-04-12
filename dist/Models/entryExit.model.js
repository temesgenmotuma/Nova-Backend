"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../Db/db"));
const entryExitModel = {
    async nonReservationEntry() {
        // const ticket = await db.entryTicket.create({
        //     data:{ 
        //      }   
        // });
    },
    async findNonReservationSpot(lotId) {
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
        const furthestReservationSpot = await db_1.default.$queryRaw `
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
    async assignSpot(lotId, entryTime) {
        // const freeSpots = await reservationModel.checkAvailability( );
    }
};
exports.default = entryExitModel;
//# sourceMappingURL=entryExit.model.js.map