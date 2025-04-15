"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../Db/db"));
const reservationModel = {
    async checkAvailability(lotId, fromTime, toTime) {
        const freeSpot = await db_1.default.spot.findFirst({
            where: {
                lotId,
                status: "Available",
            },
        });
        if (freeSpot)
            return freeSpot;
        //check if the spot is available during the time the customer wants to reserve
        const fromDateTime = new Date(fromTime).toISOString();
        const toDateTime = new Date(toTime).toISOString();
        const spot = await db_1.default.spot.findFirst({
            where: {
                lotId: lotId,
                OR: [
                    {
                        reservations: {
                            every: {
                                status: "ACTIVE", // test this out.
                                OR: [
                                    {
                                        startTime: {
                                            gt: toDateTime,
                                        },
                                    },
                                    {
                                        endTime: {
                                            lt: fromDateTime,
                                        },
                                    },
                                ],
                            },
                        },
                    },
                    {
                        reservations: {
                            none: {},
                        },
                    },
                ],
            },
        });
        return spot;
        //it is occupied now and occupationType is reservation - reservation can still be made 
        //for non-reservation customers priority shoudld be to find a spot that is free now
        //if the spot is occupied and occupationType is nonreservation - no reservation can be made
        /* if(spot?.status !== "Available" && spot?.occupationType === "NONRESERVATION"){
          return null;
        } */
    },
    async reserve(spotId, reservation) {
        const result = await db_1.default.$transaction(async (tx) => {
            //lock the row 
            await tx.$executeRaw `SELECT * FROM "Spot" WHERE id=${spotId} FOR UPDATE;`;
            /* await tx.reservation.create({
              data:{
                startTime: reservation.startTime,
                endTime: reservation.endTime,
                vehicleId: reservation.vehicleId,
                spotId: spotId,
                status: "ACTIVE",
              },
            });
       */
            //TODO:payment likely to go in here 
            //create a reservation record and update the status in spot to reserved
            return await tx.spot.update({
                where: {
                    id: spotId
                },
                data: {
                    status: "Reserved",
                    occupationType: "RESERVATION",
                    reservations: {
                        create: {
                            startTime: reservation.startTime,
                            endTime: reservation.endTime,
                            vehicleId: reservation.vehicleId,
                            status: "ACTIVE",
                        }
                    }
                },
            });
        });
        return result;
    },
    async cancelReservation(reservationId) {
        //free the spot 
        //mark the reservation as cancelled 
        return await db_1.default.reservation.update({
            where: {
                id: reservationId,
                status: "ACTIVE", //only update if the reservation is active
            },
            data: {
                status: "CANCELLED",
                spot: {
                    update: {
                        status: "Available",
                    },
                },
            },
        });
    },
    async getReservationsByVehicle(id, customerId) {
        return await db_1.default.reservation.findMany({
            where: {
                vehicle: {
                    id,
                    customer: {
                        id: customerId,
                    },
                },
            },
        });
    },
};
exports.default = reservationModel;
//# sourceMappingURL=reservation.model.js.map