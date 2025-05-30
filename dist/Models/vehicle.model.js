"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../Db/db"));
const vehicleModel = {
    async getVehicles(customerId) {
        const vehicles = await db_1.default.vehicle.findMany({
            where: {
                customerId: customerId,
                deletedAt: null,
            },
        });
        return vehicles;
    },
    async getVehicle(vehicleId, customerId) {
        return await db_1.default.vehicle.findFirst({
            where: {
                id: vehicleId,
                deletedAt: null,
                customerId: customerId,
            },
            omit: {
                deletedAt: true,
                customerId: true,
            }
        });
    },
    async createVehicle(customerId, vehicle) {
        return await db_1.default.vehicle.create({
            data: {
                make: vehicle.make,
                model: vehicle.model,
                color: vehicle.color,
                licensePlateNumber: vehicle.licensePlateNumber,
                customerId: customerId,
            },
        });
    },
    async deleteVehicle(vehicleId) {
        return await db_1.default.vehicle.update({
            where: {
                id: vehicleId,
                deletedAt: null,
            },
            data: {
                deletedAt: new Date(),
            },
        });
    }
};
exports.default = vehicleModel;
//# sourceMappingURL=vehicle.model.js.map