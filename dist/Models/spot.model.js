"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../Db/db"));
const ModelError_1 = __importDefault(require("./ModelError"));
const spotModel = {
    async createSpot(name, number, floor, startingNumber, zoneId) {
        const zone = await db_1.default.zone.findUnique({
            where: {
                id: zoneId,
            },
            select: {
                totalNumberOfSpots: true,
                _count: {
                    select: {
                        spots: true
                    }
                }
            }
        });
        if (!zone) {
            throw new ModelError_1.default("Zone not found", 404);
        }
        const numberOfCreatedSpots = zone?._count.spots;
        const { totalNumberOfSpots } = zone;
        if (number > (totalNumberOfSpots - numberOfCreatedSpots)) {
            throw new ModelError_1.default("Capacity Exceeded", 400);
        }
        return await db_1.default.$queryRaw `
      INSERT INTO "Spot" (id, name, floor, status, "zoneId", "createdAt", "updatedAt")
        SELECT 
          gen_random_uuid(),
          CONCAT(${name}::text, n) AS name,
          ${floor}::int,
          'Available'::"SpotStatus", 
          ${zoneId},
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