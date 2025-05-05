"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../Db/db"));
const lotModel = {
    async getLotsOfCurrProvider(providerId) {
        return await db_1.default.lot.findMany({
            where: {
                providerId: providerId,
            },
            omit: {
                providerId: true,
            }
        });
    },
    //create a lot and the spots associated with the lot
    async createLot(lot, providerId) {
        const { name: lotName, capacity, location: { latitude, longitude },
        // spot: { name: spotName, numberOfSpots, floor, startingNumber },
         } = lot;
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
            return lot[0];
            /*const id = lot[0]?.id;
      
            let spots;
            if (numberOfSpots > 0) {
              const spotsArray = Array.from({ length: numberOfSpots }).map(
                (_, i) => ({
                  name: `${spotName}${startingNumber + i}`,
                  floor: floor,
                  status: SpotStatus.Available,
                  zoneId: id,
                })
              );
              spots = await tx.spot.createManyAndReturn({
                data: spotsArray,
              });
            }
            return spots;
            */
        });
        return result;
    },
    async getSpotsByLot(provId, lotId) {
        //is the providerId filter redundant?
        return await db_1.default.spot.findMany({
            where: {
                zone: {
                    lot: {
                        id: lotId,
                        providerId: provId,
                    }
                }
            },
        });
    },
    async getNearbylots(area) {
        const { location: { longitude, latitude }, radius } = area;
        return await db_1.default.$queryRaw `
      SELECT name, ST_AsText(location) AS location 
      FROM "Lot" 
      WHERE ST_DWithin(
        location,
        ST_SetSRID(ST_MAKEPOINT(${longitude}, ${latitude}),4326),
        ${radius}
      )  
    `;
    },
};
exports.default = lotModel;
//# sourceMappingURL=lot.model.js.map