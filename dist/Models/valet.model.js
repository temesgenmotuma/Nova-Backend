"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../Db/db"));
const entryExit_model_1 = __importDefault(require("./entryExit.model"));
const ModelError_1 = __importDefault(require("./ModelError"));
const valetModel = {
    async createValetTicket(valetId, lotId, vehicle, customer) {
        //TODO: Check if this query is necessary
        const reservationCust = await db_1.default.reservation.findFirst({
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
            include: {
                spot: true,
            }
        });
        //If the customer doesn't have reservation => it is a walk-in customer
        //This works only if -> A customer can't reserve without 1st creating a vehicle
        const ticket = await db_1.default.valetTicket.create({
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
        let spot, occupationType;
        if (reservationCust !== null) {
            spot = reservationCust.spot;
            occupationType = "RESERVATION";
        }
        else {
            spot = await entryExit_model_1.default.findNonReservationSpot(lotId);
            occupationType = "NONRESERVATION";
        }
        if (!spot) {
            throw new ModelError_1.default("No free spot found.", 404);
        }
        await db_1.default.spot.update({
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
    async requestVehicleRetrieval(vehicleId) {
    },
};
exports.default = valetModel;
//# sourceMappingURL=valet.model.js.map