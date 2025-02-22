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
            SELECT gen_random_uuid(), 
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
};
exports.default = spotModel;
//# sourceMappingURL=spot.model.js.map