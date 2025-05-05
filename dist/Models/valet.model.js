"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../Db/db"));
const valetModel = {
    async createValetTicket(valetId, vehicle, customer) {
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
        return ticket;
    },
};
exports.default = valetModel;
//# sourceMappingURL=valet.model.js.map