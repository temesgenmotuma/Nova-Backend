import db from "../Db/db";
import { vehicleCreateType } from "../Controllers/vehicle.controller";

const vehicleModel = {
  async getVehicles(customerId: string) {
    const vehicles = await db.vehicle.findMany({
      where: {
        customerId: customerId,
        deletedAt: null,
      },
    });
    return vehicles;
  },

  async getVehicle(vehicleId: string, customerId: string) {
    return await db.vehicle.findFirst({
      where: {
        id: vehicleId,
        deletedAt: null,
        customerId: customerId,
      },
      omit:{
        deletedAt: true,
        customerId: true,
      }
    });
  },

  async createVehicle(customerId: string, vehicle: vehicleCreateType) {
    return await db.vehicle.create({
      data: {
        make: vehicle.make,
        model: vehicle.model,
        color: vehicle.color,
        licensePlateNumber: vehicle.licensePlateNumber,
        customerId: customerId,
      },
    });
  },

  async deleteVehicle(vehicleId: string) {
    return await db.vehicle.update({
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

export default vehicleModel;
