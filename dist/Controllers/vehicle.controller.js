"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVehicle = exports.createVehicle = exports.getVehicle = exports.getVehicles = void 0;
const zod_1 = require("zod");
const vehicle_model_1 = __importDefault(require("../Models/vehicle.model"));
const vehicleCreateSchema = zod_1.z.object({
    make: zod_1.z.string(),
    model: zod_1.z.string(),
    color: zod_1.z.string(),
    licensePlateNumber: zod_1.z.string(),
});
const getVehicles = async (req, res) => {
    const customerId = req?.user?.id;
    try {
        const vehicles = await vehicle_model_1.default.getVehicles(customerId);
        res.json(vehicles);
    }
    catch (error) {
        console.error(error);
        res
            .status(500)
            .json({
            message: "Error fetching vehicles",
            error: error.message,
        });
    }
};
exports.getVehicles = getVehicles;
const getVehicle = async (req, res) => {
    const customerId = req?.user?.id;
    const { vehicleId } = req.params;
    if (!vehicleId) {
        res.status(400).json({ message: "Invalid user input." });
        return;
    }
    try {
        const vehicle = await vehicle_model_1.default.getVehicle(vehicleId, customerId);
        if (!vehicle) {
            res.status(404).json({ message: "Vehicle not found" });
            return;
        }
        res.json(vehicle);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching vehicle", error: error.message, });
    }
};
exports.getVehicle = getVehicle;
const createVehicle = async (req, res) => {
    const customerId = req?.user?.id;
    const value = vehicleCreateSchema.safeParse(req.body);
    if (!value.success) {
        res.status(400).json({ error: value.error });
        return;
    }
    try {
        const vehicle = await vehicle_model_1.default.createVehicle(customerId, value.data);
        res.status(201).json({
            make: vehicle.make,
            model: vehicle.model,
            color: vehicle.model,
            licensePlateNumber: vehicle.licensePlateNumber,
        });
    }
    catch (error) {
        console.error(error);
        res
            .status(500)
            .json({
            message: "Error creating vehicle",
            error: error.message,
        });
    }
};
exports.createVehicle = createVehicle;
const deleteVehicle = async (req, res) => {
    const customerId = req?.user?.id;
    const { vehicleId } = req.params;
    if (!vehicleId) {
        res.status(400).json({ message: "Invalid user input." });
        return;
    }
    try {
        const vehicle = await vehicle_model_1.default.getVehicle(vehicleId, customerId);
        if (!vehicle) {
            res.status(404).json({ message: "Vehicle not found or is deleted." });
            return;
        }
        await vehicle_model_1.default.deleteVehicle(vehicle.id);
        res.json({ message: "Vehicle deleted" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting vehicle", error: error.message, });
    }
};
exports.deleteVehicle = deleteVehicle;
//# sourceMappingURL=vehicle.controller.js.map