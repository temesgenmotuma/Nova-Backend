"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestVehicleRetreival = exports.createValetTicket = void 0;
const zod_1 = require("zod");
const valet_model_1 = __importDefault(require("../Models/valet.model"));
const sendEmail_1 = __importDefault(require("../services/email/sendEmail"));
const ModelError_1 = __importDefault(require("../Models/ModelError"));
const createValetTicketSchema = zod_1.z.object({
    vehicle: zod_1.z.object({
        licensePlate: zod_1.z.string(),
        make: zod_1.z.string().optional(),
        model: zod_1.z.string().optional(),
        color: zod_1.z.string().optional(),
        lotId: zod_1.z.string().uuid().optional(),
        //TODO: This field will be deleted and come from the auth user
    }),
    customer: zod_1.z.object({
        email: zod_1.z.string(),
    }),
});
const vehicleRetreivalSchema = zod_1.z.object({
    uuidSchema: zod_1.z.string().uuid(),
});
const createValetTicket = async (req, res) => {
    const { id: valetId, role, lotId: id } = req.user;
    //TODO: Maybe removed when permissions are implemented
    if (role !== "Valet") {
        res.status(403).json({ message: "Forbidden" });
        return;
    }
    const parsedBody = createValetTicketSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({ message: parsedBody.error.errors });
        return;
    }
    const lotId = id || req.body.vehicle.lotId;
    //TODO: Handle lotId value with diffrent roles.
    if (!valetId || !lotId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    try {
        const { vehicle, customer } = parsedBody.data;
        const valetParking = await valet_model_1.default.createValetTicket(valetId, lotId, vehicle, customer);
        const vehicleId = valetParking.ticket.vehicle.id;
        await (0, sendEmail_1.default)(customer.email, "Valet Ticket Created", `Here is the link: http:localhost:3000/vehicles?id=${vehicleId}`);
        res.status(201).json({ message: "Confirmation email sent.", valetParking });
    }
    catch (error) {
        if (error instanceof ModelError_1.default) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
        console.error(error);
        res
            .status(500)
            .json({
            message: "Internal server error",
            error: error.message,
        });
    }
};
exports.createValetTicket = createValetTicket;
const requestVehicleRetreival = async (req, res) => {
    const vehicle = vehicleRetreivalSchema.safeParse(req.params);
    if (!vehicle.success) {
        res.status(400).json({ message: vehicle.error.errors });
        return;
    }
    try {
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};
exports.requestVehicleRetreival = requestVehicleRetreival;
//# sourceMappingURL=valet.controller.js.map