import db from "../Db/db";

import { customerType, vehicleType } from "../Controllers/valet.controller";

const valetModel = {
  async createValetTicket(valetId: string, vehicle: vehicleType, customer: customerType) {
    const reservationCust = await db.reservation.findFirst({
      where: {
        vehicle: {
          licensePlateNumber: vehicle.licensePlate,
          entryTickets: null,
        },
        status: "ACTIVE",
        startTime: {
            gte: new Date(),
        },
      },
    });
    
    //If the customer doesn't have reservation => it is a walk-in customer
    //This works only if -> A customer can't reserve without 1st creating a vehicle
    const ticket = await db.valetTicket.create({
      data: {
        customerEmail: customer.email,
        vehicle: {
          connectOrCreate: {
            where: {
              licensePlateNumber: vehicle.licensePlate,
            },
            create: {
              licensePlateNumber: vehicle.licensePlate,
              make: vehicle.make,
              model: vehicle.model,
              color: vehicle.color,
            },
          },
        },
        issuer: {
          connect: {
            id: valetId,
          },
        },
      },
      select: {
        id: true,
        vehicle: {
          select: {
            id: true,
            licensePlateNumber: true,
            make: true,
            model: true,
            color: true,
          },
        },
        customer: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
    return ticket;
  },
};

export default valetModel;
