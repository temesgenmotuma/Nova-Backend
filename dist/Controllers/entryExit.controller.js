"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nonReservationEntry = void 0;
const zod_1 = require("zod");
const entryExit_model_1 = __importDefault(require("../Models/entryExit.model"));
const nonResEntryQuerySchema = zod_1.z
    .object({
    licensePlate: zod_1.z
        .string()
        .regex(/^\d{1,3}(AA|ET|UN|AU|AF|AM|BG|DR|GM|HR|OR|SM|CD|AO)([A-C]\d{5}|\d{5}|\d{4})$/),
    entryTime: zod_1.z.string().datetime(),
    lotId: zod_1.z.string().uuid().optional()
})
    .refine((data) => new Date(data.entryTime) >= new Date(), {
    message: "Entry time must not be in the past",
    path: ["entryTime"],
});
const plateNumbercodes = ["AA", "ET", "UN", "AU", "AF", "AM", "BG"];
const nonReservationEntry = async (req, res) => {
    const result = nonResEntryQuerySchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ message: "Invalid request", errors: result.error.flatten().fieldErrors, });
        return;
    }
    try {
        const { licensePlate, entryTime, lotId: userLotId } = result.data;
        const lotId = req.user?.lotId || userLotId;
        // The attendent assigns spot
        const spot = await entryExit_model_1.default.findNonReservationSpot(lotId);
        //The ticket is created and sent to the customer
        const ticket = await entryExit_model_1.default.nonReservationEntry();
        res
            .status(200)
            .json({ message: "Entry successful", data: { licensePlate, entryTime } });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error", error: err.message, });
    }
};
exports.nonReservationEntry = nonReservationEntry;
//# sourceMappingURL=entryExit.controller.js.map