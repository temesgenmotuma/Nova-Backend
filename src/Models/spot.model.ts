import db from "../Db/db";
import ModelError from "./ModelError";

const spotModel = {
  async createSpot(
    name: string,
    number: number,
    floor: number,
    startingNumber: number,
    lotId: string
  ) {

    const lot = await db.lot.findUnique({
      where: {
        id: lotId,
      },
      select: {
        capacity: true,
      },
    });

    if (lot && (lot?.capacity < startingNumber + number - 1)) {
      throw new ModelError("Capacity Exceeded", 400);
    }
  
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