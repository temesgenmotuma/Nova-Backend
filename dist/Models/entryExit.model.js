"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../Db/db"));
const ModelError_1 = __importDefault(require("./ModelError"));
const entryExitModel = {
    async findNonReservationSpot(lotId) {
        //TODO: test the first path
        //TODO: What should the value of the status below be??????
        const spotWithNoReservations = await db_1.default.spot.findFirst({
            where: {
                status: "Reserved",
                lotId,
                reservations: {
                    none: {
                        OR: [
                            {
                                startTime: {
                                    gte: new Date(),
                                },
                            },
                            {
                                endTime: {
                                    gte: new Date(),
                                },
                            },
                        ],
                    },
                },
            },
            select: {
                id: true,
                name: true,
                floor: true,
            },
        });
        if (spotWithNoReservations) {
            return spotWithNoReservations;
        }
        const now = new Date();
        const furthestReservationSpot = await db_1.default.$queryRaw `
          WITH "furthestResOfEachSpot" AS (
            SELECT 
              s.id "spotId" , 
              s.name "spotName", 
              s.floor floor, 
              MAX(r."startTime") "startTime" 
            FROM "Reservation" r
            JOIN "Spot" s ON r."spotId"=s.id 
            WHERE
              s."lotId" = ${lotId} 
              r."startTime" >= ${now}
              r."Status" != 'CANCELLED'
            GROUP BY s.id, s.name, s.floor
          )
          SELECT 
           s.id,
           s.name,
           s.floor,  
           r."startTime" --to check
          FROM "Reservation" r 
          JOIN "Spot" s ON s.id=r."spotId"
          WHERE 
           "startTime" = ( 
                 SELECT MAX("startTime") 
                 FROM "furthestResOfEachSpot"
           )
          AND
           r."startTime" >= ${now}
        `;
        return furthestReservationSpot[0];
    },
    async nonReservationEntry(spotId, lotId, reqObj) {
        const { licensePlate, phoneNumber, vehicle } = reqObj;
        //TODO: There should be some check on the time that has passed since the reservation start time.
        //TODO:Should license plate filter be here??
        const activeTicket = await db_1.default.entryTicket.findFirst({
            where: {
                phoneNumber,
                status: "ACTIVE",
                licensePlate,
            },
        });
        //TODO: Test this case
        if (activeTicket) {
            throw new ModelError_1.default("There is an existing active ticket with this phone number", 409);
        }
        const ticket = await db_1.default.$transaction(async (tx) => {
            const newVehicle = await db_1.default.vehicle.upsert({
                where: {
                    licensePlateNumber: licensePlate,
                },
                update: {},
                create: {
                    licensePlateNumber: licensePlate,
                },
            });
            const newTicket = await tx.entryTicket.create({
                data: {
                    spotId,
                    entryTime: new Date(),
                    licensePlate: licensePlate,
                    phoneNumber,
                    vehicleId: newVehicle.id,
                },
                omit: {
                    createdAt: true,
                    updatedAt: true,
                }
            });
            await tx.spot.update({
                where: {
                    id: spotId,
                },
                data: {
                    status: "Occupied",
                    occupationType: "NONRESERVATION",
                },
            });
            return newTicket;
        });
        return ticket;
    },
    async nonReservationExit() {
    },
    async reservationEntry(licensePlate, phone, lotId) {
        const reservation = await db_1.default.reservation.findFirst({
            where: {
                licensePlate,
                status: "ACTIVE",
                spot: {
                    lotId: lotId,
                },
            },
            include: {
                vehicle: {
                    select: {
                        id: true,
                    },
                },
            },
        });
        if (!reservation)
            throw new ModelError_1.default("Reservation not found", 404);
        const ticket = await db_1.default.entryTicket.create({
            data: {
                spotId: reservation.spotId,
                entryTime: new Date(),
                licensePlate: reservation.licensePlate,
                phoneNumber: phone,
                vehicleId: reservation.vehicle.id,
            },
        });
        return ticket;
    }
};
exports.default = entryExitModel;
//# sourceMappingURL=entryExit.model.js.map