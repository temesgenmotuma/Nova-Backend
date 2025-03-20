"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../Db/db"));
const ModelError_1 = __importDefault(require("./ModelError"));
const spotModel = {
    async createSpot(name, number, floor, startingNumber, lotId) {
        const lot = await db_1.default.lot.findUnique({
            where: {
                id: lotId,
            },
            select: {
                capacity: true,
            },
        });
        if (lot && (lot?.capacity < startingNumber + number - 1)) {
            throw new ModelError_1.default("Capacity Exceeded", 400);
        }
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
    async cancelReservation(reservationId) {
        //free the spot 
        //mark the reservation as cancelled 
        return await db_1.default.reservation.update({
            where: {
                id: reservationId,
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
    }
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