"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSpot = void 0;
const joi_1 = __importDefault(require("joi"));
const spot_model_1 = __importDefault(require("../Models/spot.model"));
const createSpotSchema = joi_1.default.object({
    name: joi_1.default.string().optional(),
    number: joi_1.default.number().integer().positive().required(),
    floor: joi_1.default.number().integer().allow(null).default(null),
    startingNumber: joi_1.default.number().integer().empty("").default(1),
    lotId: joi_1.default.string().uuid(),
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
//# sourceMappingURL=spot.controller.js.map