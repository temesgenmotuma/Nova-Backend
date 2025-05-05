"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createZone = void 0;
const zod_1 = require("zod");
const zone_model_1 = __importDefault(require("../Models/zone.model"));
const createZoneSchema = zod_1.z
    .object({
    name: zod_1.z.string().regex(/^[A-Za-z][A-Za-z0-9 ]*$/).min(1).max(20),
    capacity: zod_1.z.number().min(1),
    vehicleType: zod_1.z
        .string()
        .transform(value => value === undefined ? null : value)
        .optional()
        .nullable(),
    spot: zod_1.z
        .object({
        name: zod_1.z.string(),
        numberOfSpots: zod_1.z.number().gte(1),
        floor: zod_1.z.number().default(0),
        startingNumber: zod_1.z.number().gte(0).default(1),
    }).optional(),
})
    .refine((data) => {
    if (data.spot) {
        return data.spot.numberOfSpots <= data.capacity;
    }
    return true;
}, {
    message: "Number of spots cannot be greater than capacity",
});
const uuidSchema = zod_1.z.string().uuid();
const createZone = async (req, res) => {
    const result = createZoneSchema.safeParse(req.body);
    const idResult = uuidSchema.safeParse(req.params.lotId);
    if (!idResult.success) {
        res.status(400).json({ message: "Missing or Invalid id" });
        return;
    }
    if (!result.success) {
        res.status(400).json({ message: "Invalid data", errors: result.error.errors });
        return;
    }
    const { name, capacity, spot } = result.data;
    const lotId = idResult.data;
    try {
        const zone = await zone_model_1.default.createZone(spot, name, capacity, lotId);
        res.status(201).json({ zone });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.createZone = createZone;
//# sourceMappingURL=zone.controller.js.map