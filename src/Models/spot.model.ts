import db from "../Db/db";
import ModelError from "./ModelError";

const spotModel = {
  async createSpot(
    name: string,
    number: number,
    floor: number,
    startingNumber: number,
    zoneId: string
  ) {
    const zone = await db.zone.findUnique({
      where:{
        id: zoneId,
      },
      select:{
        totalNumberOfSpots:true,
        _count:{
          select:{
            spots:true
          }
        }
      }
    });

    if(!zone){
      throw new ModelError("Zone not found", 404);
    }

    const numberOfCreatedSpots = zone?._count.spots ;
    const {totalNumberOfSpots} = zone;

    if (number > (totalNumberOfSpots - numberOfCreatedSpots)){
      throw new ModelError("Capacity Exceeded", 400);
    }
  
    return await db.$queryRaw`
      INSERT INTO "Spot" (id, name, floor, status, "zoneId", "createdAt", "updatedAt")
        SELECT 
          gen_random_uuid(),
          CONCAT(${name}::text, n) AS name,
          ${floor}::int,
          'Available'::"SpotStatus", 
          ${zoneId},
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