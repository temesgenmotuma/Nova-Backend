"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../Db/db"));
const spotModel = {
    async createSpot(name, number, floor, startingNumber, lotId) {
        return await db_1.default.$queryRaw `
      INSERT INTO "Spot" (id, name, floor, status, "lotId", "createdAt", "updatedAt")
        SELECT 
          gen_random_uuid(), 
          CONCAT(${name}::text, n) AS name,
          ${floor}::int,
          'Available'::"SpotStatus", 
          ${lotId},
          NOW(),
          NOW()
        FROM generate_series(COALESCE(${startingNumber}, 1)::int, ${startingNumber + number - 1}::int) AS n
        RETURNING *;
    `;
    },
    async getSpotById(id) {
        return await db_1.default.spot.findUnique({
            where: {
                id,
            },
        });
    },
    async updateSpot(spotId, name, floor) {
        return await db_1.default.spot.update({
            where: {
                id: spotId,
            },
            data: {
                ...(name && { name }),
                ...(floor && { floor }),
            },
        });
    },
    async checkAvailability(lotId, fromTime, toTime) {
        //check if the spot is available during the time the customer wants to reserve
        const fromDateTime = new Date(fromTime).toISOString();
        const toDateTime = new Date(toTime).toISOString();
        return await db_1.default.spot.findFirst({
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
    async reserve(spotId, reservation) {
        const result = await db_1.default.$transaction(async (tx) => {
            //lock the row 
            await tx.$executeRaw `SELECT * FROM "Spot" WHERE id=${spotId} FOR UPDATE;`;
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
                where: {
                    id: spotId
                },
                data: {
                    status: "Reserved",
                    reservations: {
                        create: {
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
exports.default = spotModel;
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
//# sourceMappingURL=spot.model.js.map