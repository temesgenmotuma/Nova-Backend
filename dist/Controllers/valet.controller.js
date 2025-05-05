"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createValetTicket = void 0;
const zod_1 = require("zod");
const valet_model_1 = __importDefault(require("../Models/valet.model"));
const createValetTicketSchema = zod_1.z.object({
    vehicle: zod_1.z.object({
        licensePlate: zod_1.z.string(),
        make: zod_1.z.string().optional(),
        model: zod_1.z.string().optional(),
        color: zod_1.z.string().optional(),
    }),
    customer: zod_1.z.object({
        email: zod_1.z.string(),
    }),
});
const createValetTicket = async (req, res) => {
    const { id: valetId, role } = req.user;
    if (!valetId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    if (role !== "VALET") {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    const parsedBody = createValetTicketSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(400).json({ error: parsedBody.error.errors });
        return;
    }
    try {
        const { vehicle, customer } = parsedBody.data;
        const ticket = await valet_model_1.default.createValetTicket(valetId, vehicle, customer);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.createValetTicket = createValetTicket;
//# sourceMappingURL=valet.controller.js.map