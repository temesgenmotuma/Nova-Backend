"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAvailability = exports.updateSpot = exports.getSpot = exports.createSpot = void 0;
const joi_1 = __importDefault(require("joi"));
const spot_model_1 = __importDefault(require("../Models/spot.model"));
const ModelError_1 = __importDefault(require("../Models/ModelError"));
const createSpotSchema = joi_1.default.object({
    name: joi_1.default.string().optional(),
    number: joi_1.default.number().integer().positive().required(),
    floor: joi_1.default.number().integer().allow(null).default(null),
    startingNumber: joi_1.default.number().integer().empty("").default(1),
    zoneId: joi_1.default.string().uuid(),
});
const updateSpotSchema = joi_1.default.object({
    name: joi_1.default.string().optional().empty("").default(null),
    floor: joi_1.default.number().integer().optional().empty("").default(null),
}).or("name", "floor");
const idSchema = joi_1.default.string().uuid();
const createSpot = async (req, res) => {
    const { value, error } = createSpotSchema.validate(req.body);
    if (error) {
        res.status(400).json({ message: "Invalid request", error: error.message });
        return;
    }
    const { number, name, floor, startingNumber, zoneId } = value;
    try {
        const spot = await spot_model_1.default.createSpot(name, number, floor, startingNumber, zoneId);
        res.status(201).json({ message: "Spot created successfully.", spot });
    }
    catch (error) {
        console.error(error);
        if (error instanceof ModelError_1.default) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
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
//# sourceMappingURL=spot.controller.js.map