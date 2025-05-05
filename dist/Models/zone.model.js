"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../Db/db"));
const zoneModel = {
    async createZone(spot, name, capacity, lotId) {
        let spots = [];
        if (spot) {
            spots.push(...Array.from({ length: spot.numberOfSpots }, (_, i) => ({
                name: `${spot.name}${spot.startingNumber + i}`,
                floor: spot.floor || 1,
            })));
        }
        const zone = await db_1.default.zone.create({
            data: {
                name: name,
                totalNumberOfSpots: capacity,
                lotId: lotId,
                spots: {
                    createMany: {
                        data: spots.filter((spot) => spot !== undefined),
                    },
                },
            },
            include: {
                spots: {
                    select: {
                        name: true,
                        floor: true,
                    },
                },
            },
        });
        return zone;
    },
};
exports.default = zoneModel;
//# sourceMappingURL=zone.model.js.map