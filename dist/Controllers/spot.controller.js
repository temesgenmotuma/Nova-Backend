"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reserve = exports.checkAvailability = exports.updateSpot = exports.getSpot = exports.createSpot = void 0;
const joi_1 = __importDefault(require("joi"));
const zod_1 = require("zod");
const spot_model_1 = __importDefault(require("../Models/spot.model"));
const createSpotSchema = joi_1.default.object({
    name: joi_1.default.string().optional(),
    number: joi_1.default.number().integer().positive().required(),
    floor: joi_1.default.number().integer().allow(null).default(null),
    startingNumber: joi_1.default.number().integer().empty("").default(1),
    lotId: joi_1.default.string().uuid(),
});
const updateSpotSchema = joi_1.default.object({
    name: joi_1.default.string().optional().empty("").default(null),
    floor: joi_1.default.number().integer().optional().empty("").default(null),
});
const idSchema = joi_1.default.string().uuid();
const reserveQuerySchema = zod_1.z.object({
    vehicleId: zod_1.z.string().uuid(),
    startTime: zod_1.z.coerce.date(),
    endTime: zod_1.z.coerce.date(),
    lotId: zod_1.z.string().uuid(),
});
const createSpot = async (req, res) => {
    const { value, error } = createSpotSchema.validate(req.body);
    if (error) {
        res.status(400).json({ message: "Invalid request", error: error.message });
        return;
    }
    const { number, name, floor, startingNumber, lotId } = value;
    try {
        const spot = await spot_model_1.default.createSpot(name, number, floor, startingNumber, lotId);
        res.status(201).json({ message: "Spot created successfully.", spot });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating spot" });
    }
};
exports.createSpot = createSpot;
const getSpot = async (req, res) => {
    const { id } = req.params;
    const { error } = idSchema.validate(id);
    if (error) {
        res.status(400).json({ message: "Invalid id.", error: error.message });
        return;
    }
    try {
        //decide whether lotid filter must be here 
        const spot = await spot_model_1.default.getSpotById(id);
        if (!spot) {
            res.status(404).json({ message: "Spot not found." });
            return;
        }
        res.json({ spot });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error getting spot.", error });
    }
};
exports.getSpot = getSpot;
const updateSpot = async (req, res) => {
    const { spotId } = req.params;
    const { error: idError } = idSchema.validate(spotId);
    const { value, error: updateError } = updateSpotSchema.validate(req.body);
    if (idError || updateError) {
        res.status(400).json({ message: "Invalid or no spotId provided." });
        return;
    }
    try {
        const { name, floor } = value;
        const updatedSpot = await spot_model_1.default.updateSpot(spotId, name, floor);
        res.json(updatedSpot);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "error updating the spot" });
    }
};
exports.updateSpot = updateSpot;
const checkAvailability = async (req, res) => {
    const { lotId } = req.params;
    try {
        /* const foundSpot = await spotModel.checkAvailability(lotId);
        if(!foundSpot){
          res.status(404).json({message: "No spots available"});
          return;
        }
        res.json({message: "Spot available", spot: foundSpot.id}) */ ;
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching availability information.", error: error.message });
    }
};
exports.checkAvailability = checkAvailability;
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
        const freeSpot = await spot_model_1.default.checkAvailability(lotId, startTime, endTime);
        if (!freeSpot) {
            res.status(404).json({ message: "Sorry. This lot is fully booked for the requested time." });
            return;
        }
        //lock the spot
        //wait until the user makes a payment.
        const reservation = await spot_model_1.default.reserve(freeSpot.id, result.data);
        res.status(201).json(reservation);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error booking spot.", error: error.message });
    }
};
exports.reserve = reserve;
//# sourceMappingURL=spot.controller.js.map