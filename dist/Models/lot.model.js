"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../Db/db"));
const client_1 = require("@prisma/client");
const lotModel = {
    //create a lot and the spots associated with the lot
    async createLot(lot, providerId) {
        const { name: lotName, capacity, location: { latitude, longitude }, spot: { name: spotName, numberOfSpots, floor, startingNumber }, } = lot;
        const result = await db_1.default.$transaction(async (tx) => {
            const lot = await tx.$queryRaw `
        INSERT INTO "Lot" (id, name, "providerId", location, capacity, "updatedAt") 
        VALUES (
          gen_random_uuid(), 
          ${lotName}, 
          ${providerId}, 
          ST_SetSRID(ST_MAKEPOINT(${longitude}, ${latitude}), 4326), 
          ${capacity}, 
          NOW()
        ) 
        RETURNING id;
      `;
            const id = lot[0]?.id;
            let spots;
            if (numberOfSpots > 0) {
                const spotsArray = Array.from({ length: numberOfSpots }).map((_, i) => ({
                    name: `${spotName}${startingNumber + i}`,
                    floor: floor,
                    status: client_1.SpotStatus.Available,
                    lotId: id,
                }));
                spots = await tx.spot.createManyAndReturn({
                    data: spotsArray,
                });
            }
            return spots;
        });
        return result;
    },
    async getSpotsByLot(provId, lotId) {
        //is the providerId filter redundant?
        return await db_1.default.spot.findMany({
            where: {
                lotId: lotId,
                lot: {
                    providerId: provId,
                },
            },
        });
    },
};
exports.default = lotModel;
//# sourceMappingURL=lot.model.js.map