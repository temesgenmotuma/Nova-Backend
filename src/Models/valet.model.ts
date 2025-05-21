import db from "../Db/db";
import { customerType, vehicleType } from "../Controllers/valet.controller";
import { Spot } from "@prisma/client";
import entryExitModel from "./entryExit.model";
import ModelError from "./ModelError";
import { OccupationType } from "@prisma/client";

const valetModel = {
  //customer and valet usecase.
  async createValetTicket(valetId: string, lotId: string, zoneId: string, vehicle: vehicleType, customer: customerType) {
    //TODO: Check if this query is necessary
    //TODO: Future improvement: Add check of the grace period
    //TODO: Payments 
    const reservationCust = await db.reservation.findFirst({
      where: {
        vehicle: {
          licensePlateNumber: vehicle.licensePlate,
          entryTickets: {
            none: {
              status: "ACTIVE",
            },
          },
        },
        status: "ACTIVE",
        endTime: {
          gt: new Date(), //endTime is not past 
        },
      },
      include: {
        spot: true,
        vehicle: {
          include: {
            customer: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });
     
    //If the customer doesn't have reservation => it is a walk-in customer
    //This works only if the f/g is enforced -> A customer can't reserve without 1st creating a vehicle
    const ticket = await db.valetTicket.create({
      data: {
        customerEmail:
          reservationCust?.vehicle.customer?.email || customer.email,
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

    let spot, occupationType: "RESERVATION" | "NONRESERVATION";
    if (reservationCust !== null) {
      spot = reservationCust.spot;
      occupationType = "RESERVATION";
    } else {
      spot = await entryExitModel.findNonReservationSpot(lotId, zoneId);
      occupationType = "NONRESERVATION";
    }

    if (!spot) {
      throw new ModelError("No free spot found.", 404);
    }

    await db.spot.update({
      where: {
        id: spot.id,
      },
      data: {
        status: "Occupied",
        occupationType: occupationType,
      },
    });

    return { ticket, spot };
  },

  async requestVehicleRetrieval(id: string) {
    const ticket = await db.valetTicket.update({
      where: {
        id: id,
      },
      data: {
        status: "VEHICLEREQUESTED",
        requestedAt: new Date(),
      },
      include: {
        vehicle: true,
        issuer: {
          select: {
            id: true,
          },
        },
      },
    });

    return ticket;
  },

  async getActiveVehicleRequests(lotId: string) {
    const activeRequests = await db.valetTicket.findMany({
      where: {
        status: "VEHICLEREQUESTED",
        issuer: {
          lotId: lotId,
        },
      },
      orderBy: {
        requestedAt: "asc",
      },
      include: {
        vehicle: {
          select: {
            id: true,
            licensePlateNumber: true,
            make: true,
            model: true,
            color: true,
          },
        },
        issuer: {
          select: {
            id: true,
          },
        },
      },
    });
    return activeRequests;
  }
};

export default valetModel;
