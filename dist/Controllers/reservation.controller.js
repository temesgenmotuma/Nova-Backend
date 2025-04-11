"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReservations = exports.cancelReservation = exports.reserve = void 0;
const zod_1 = require("zod");
const reservation_model_1 = __importDefault(require("../Models/reservation.model"));
const reserveQuerySchema = zod_1.z.object({
    vehicleId: zod_1.z.string().uuid(),
    startTime: zod_1.z.coerce.date(),
    endTime: zod_1.z.coerce.date(),
    lotId: zod_1.z.string().uuid(),
});
const futureIdSchema = zod_1.z.string().uuid();
const reserve = async (req, res) => {
    const customerId = req?.user?.id;
    const result = reserveQuerySchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ message: "Invalid request", error: result.error });
        return;
    }
    try {
        /** THESE 2 ARE DONE ON THE FRONTEND
        //check if customer has a vehicle
        //if not, prompt user to register a vehicle
        */
        //check spot availability during the time the customer wants to reserve
        //If a spot is available somehow choose a parking spot
        const { lotId, startTime, endTime } = result.data;
        const freeSpot = await reservation_model_1.default.checkAvailability(lotId, startTime, endTime);
        if (!freeSpot) {
            res.status(404).json({ message: "Sorry. This lot is fully booked for the requested time." });
            return;
        }
        //lock the spot
        //wait until the user makes a payment.
        const reservation = await reservation_model_1.default.reserve(freeSpot.id, result.data);
        res.status(201).json(reservation);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error booking spot.", error: error.message });
    }
};
exports.reserve = reserve;
const cancelReservation = async (req, res) => {
    const { id } = req.params;
    const result = futureIdSchema.safeParse(id);
    if (!result.success) {
        res.status(400).json({ message: "Invalid request", error: result.error });
        return;
    }
    try {
        const reservation = await reservation_model_1.default.cancelReservation(id);
        if (!reservation) {
            res.status(404).json({ message: "Reservation not found." });
            return;
        }
        res.status(204).json({ message: "Reservation canceled." });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error canceling reservation.", error: error.message });
    }
};
exports.cancelReservation = cancelReservation;
const getReservations = async (req, res) => {
    const customerId = req?.user?.id;
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ message: "Invalid request." });
        return;
    }
    try {
        const reservations = await reservation_model_1.default.getReservationsByVehicle(id, customerId);
        res.json(reservations);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error getting reservations.", error: error.message });
    }
};
exports.getReservations = getReservations;
//# sourceMappingURL=reservation.controller.js.map