"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSpotsByLot = exports.createLot = exports.createLotSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const lot_model_1 = __importDefault(require("../Models/lot.model"));
const spotSchema = joi_1.default.object({
    numberOfSpots: joi_1.default.number().integer().empty("").default(0),
    startingNumber: joi_1.default.number().integer().default(1).empty(""),
    name: joi_1.default.string().default("P").empty(""),
    floor: joi_1.default.number().integer().empty("").optional(),
});
exports.createLotSchema = joi_1.default.object({
    name: joi_1.default.string().required(),
    capacity: joi_1.default.number().required(),
    location: joi_1.default.object({
        latitude: joi_1.default.number().required(),
        longitude: joi_1.default.number().required(),
    }),
    // address: joi.object({
    //   region: joi.string(),
    //   city: joi.string(),
    //   woreda: joi.string(),
    // }),
    spot: joi_1.default.alternatives().try(spotSchema).default({}).optional(),
});
const createLot = async (req, res) => {
    const providerId = req.user?.providerId;
    const { value, error } = exports.createLotSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
    }
    try {
        const lot = await lot_model_1.default.createLot(value, providerId);
        res.status(201).json(lot);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error creating lot." });
    }
};
exports.createLot = createLot;
const getSpotsByLot = async (req, res) => {
    const provId = req.user?.providerId;
    const lotId = req.params.lotId;
    if (!lotId) {
        res.status(400).json({ message: "lotId is required" });
        return;
    }
    try {
        //get spots of a the current provider and a particular lot.
        const spots = await lot_model_1.default.getSpotsByLot(provId, lotId);
        res.status(200).json({ spots });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching spots" });
    }
};
exports.getSpotsByLot = getSpotsByLot;
//# sourceMappingURL=lot.controller.js.map