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