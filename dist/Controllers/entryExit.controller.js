"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reservationEntry = exports.nonReservationExit = exports.nonReservationEntry = void 0;
const zod_1 = require("zod");
const entryExit_model_1 = __importDefault(require("../Models/entryExit.model"));
const ModelError_1 = __importDefault(require("../Models/ModelError"));
//TODO: May be make all the letters in license plates uppercase
const baseNonResEntrySchema = zod_1.z.object({
    phoneNumber: zod_1.z.string().regex(/^(09\d{8}|07\d{8}|\+2519\d{8})$/),
    licensePlate: zod_1.z
        .string()
        .regex(/^\d{1,3}(AA|ET|UN|AU|AF|AM|BG|DR|GM|HR|OR|SM|CD|AO)([A-C]\d{5}|\d{5}|\d{4})$/),
    lotId: zod_1.z.string().uuid().optional(),
    zoneId: zod_1.z.string().uuid(),
    vehicle: zod_1.z
        .object({
        make: zod_1.z.string(),
        model: zod_1.z.string(),
        color: zod_1.z.string(),
    })
        .optional(),
    // entryTime: z.string().datetime(),
});
const resEntrySchema = zod_1.z.object({
    licensePlate: zod_1.z.string().regex(/^\d{1,3}(AA|ET|UN|AU|AF|AM|BG|DR|GM|HR|OR|SM|CD|AO)([A-C]\d{5}|\d{5}|\d{4})$/),
    phone: zod_1.z.string().regex(/^(09\d{8}|07\d{8}|\+2519\d{8})$/),
    lotId: zod_1.z.string().uuid().optional(),
});
const nonReservationEntry = async (req, res) => {
    const result = baseNonResEntrySchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ message: "Invalid request", errors: result.error.flatten().fieldErrors, });
        return;
    }
    const lotId = req.user?.lotId || result.data.lotId;
    if (!req.user?.lotId && !result.data.lotId) {
        res.status(400).json({ message: "lotId is required" });
        return;
    }
    try {
        // The attendent assigns spot
        const spot = await entryExit_model_1.default.findNonReservationSpot(lotId, result.data.zoneId);
        if (!spot) {
            res.status(404).json({ message: "No free spot found in this parking lot." });
            return;
        }
        //The ticket is created and sent to the customer
        const ticket = await entryExit_model_1.default.nonReservationEntry(spot.id, lotId, result.data);
        res.status(200).json({ ticket });
    }
    catch (error) {
        if (error instanceof ModelError_1.default) {
            res.status(error.statusCode).json({ message: error.message });
        }
        console.error(error);
        res.status(500).json({ message: "Internal server error", error: error.message, });
    }
};
exports.nonReservationEntry = nonReservationEntry;
const nonReservationExit = async (req, res) => {
};
exports.nonReservationExit = nonReservationExit;
const reservationEntry = async (req, res) => {
    const result = resEntrySchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ message: "Invalid request", error: result.error.flatten().fieldErrors });
        return;
    }
    if (!req.user?.lotId && !result.data.lotId) {
        res.status(400).json({ message: "lotId is required" });
        return;
    }
    const lotId = req.user?.lotId || result.data.lotId;
    const { licensePlate, phone } = result.data;
    try {
        const ticket = await entryExit_model_1.default.reservationEntry(licensePlate, phone, lotId);
        res.status(201).json({ ticket });
    }
    catch (error) {
        if (error instanceof ModelError_1.default) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
        console.error(error);
        res.status(500).json({ message: "Internal server error", error: error.message, });
    }
};
exports.reservationEntry = reservationEntry;
//# sourceMappingURL=entryExit.controller.js.map