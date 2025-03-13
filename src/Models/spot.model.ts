import db from "../Db/db";

import { ReserveQueryType } from "../Controllers/spot.controller";

const spotModel = {
  async createSpot(
    name: string,
    number: number,
    floor: number,
    startingNumber: number,
    lotId: string
  ) {
    return await db.$queryRaw`
      INSERT INTO "Spot" (id, name, floor, status, "lotId", "createdAt", "updatedAt")
        SELECT 
          gen_random_uuid(), 
          CONCAT(${name}::text, n) AS name,
          ${floor}::int,
          'Available'::"SpotStatus", 
          ${lotId},
          NOW(),
          NOW()
        FROM generate_series(COALESCE(${startingNumber}, 1)::int, ${
      startingNumber + number - 1
    }::int) AS n
        RETURNING *;
    `;
  },

  async getSpotById(id: string) {
    return await db.spot.findUnique({
      where: {
        id,
      },
    });
  },

  async updateSpot(spotId: string, name: string, floor: number) {
    return await db.spot.update({
      where: {
        id: spotId,
      },
      data: {
        ...(name && { name }),
        ...(floor && { floor }),
      },
    });
  },

  async checkAvailability(lotId: string, fromTime: Date, toTime: Date) {
    //check if the spot is available during the time the customer wants to reserve
    const fromDateTime = new Date(fromTime).toISOString();
    const toDateTime = new Date(toTime).toISOString();

    return await db.spot.findFirst({
      where: {
        lotId: lotId,
        OR: [
          {
            reservations: {
              every: {
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
      return await tx.spot.update({
        where:{
          id: spotId
        },
        data:{
          status: "Reserved",
          reservations:{
            create:{
              startTime: reservation.startTime,
              endTime: reservation.endTime,
              vehicleId: reservation.vehicleId,
              status: "ACTIVE",
            }
          }
        },
      });
    });
    return result;
  },
};

export default spotModel;


/*  */

        /*
        AND: [
          {
            startTime: {
              gt: fromDateTime
            }
          },
          {
            endTime: {
              
            }
          }
        ]
        */

        /* await db.reservation.findFirst({
          where: {
            spotId: lotId, // this line is wrong correct 
            status: "ACTIVE",
            OR: [
              {
                AND: [
                  {
                    startTime: {
                      gte: fromDateTime,
                    },
                  },
                  {
                    endTime: {
                      lte: fromDateTime,
                    },
                  },
                ],
              },
              {
                AND: [
                  {
                    startTime: {
                      gte: toDateTime,
                    },
                  },
                  {
                    endTime: {
                      lte: toDateTime,
                    },
                  },
                ],
              },
            ],
          },
        }); */

        /*
        OR: [
              {
                AND: [
                  {
                    startTime: {
                      gte: fromDateTime,
                    },
                  },
                  {
                    endTime: {
                      lte: fromDateTime,
                    },
                  },
                ],
              },
              {
                AND: [
                  {
                    startTime: {
                      gte: toDateTime,
                    },
                  },
                  {
                    endTime: {
                      lte: toDateTime,
                    },
                  },
                ],
              },
            ],
        */