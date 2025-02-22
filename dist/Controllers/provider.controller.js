"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProvider = void 0;
const joi_1 = __importDefault(require("joi"));
const provider_model_1 = __importDefault(require("../Models/provider.model"));
const generateToken_1 = __importDefault(require("../utils/generateToken"));
const employeeSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    name: joi_1.default.string().required(),
    password: joi_1.default.string().required().min(8),
    phone: joi_1.default.string().pattern(/^09\d{8}$/).required(),
    role: joi_1.default.string().valid("admin", "valet").optional(),
});
const providerSchema = joi_1.default.object({
    phone: joi_1.default.string().pattern(/^09\d{8}$/).required(),
    name: joi_1.default.string().required().lowercase(),
    email: joi_1.default.string().email(),
    hasValet: joi_1.default.boolean().required(),
});
const createProviderSchema = joi_1.default.object({
    employee: employeeSchema,
    provider: providerSchema,
});
var Role;
(function (Role) {
    Role[Role["Admin"] = 0] = "Admin";
    Role[Role["Valet"] = 1] = "Valet";
})(Role || (Role = {}));
const createProvider = async (req, res) => {
    const { value, error } = createProviderSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
    }
    try {
        const providerExists = await provider_model_1.default.getProvider(value.provider.name);
        if (providerExists) {
            res.status(409).json({ error: "The name is already taken." });
            return;
        }
        const { employee: emp, provider: prov } = value;
        const employee = await provider_model_1.default.create(emp, prov);
        //TODO: maybe this goes in the model in a transaction.
        const payload = {
            providerId: employee.provider.id,
            employeeId: employee.id,
            role: employee.role,
        };
        const token = (0, generateToken_1.default)(payload, res);
        res.json({
            token: token,
            emplyee: {
                id: employee.id,
                name: employee.name,
            },
            provider: {
                id: employee.provider.id,
                name: employee.provider.name,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error creating provider." });
    }
};
exports.createProvider = createProvider;
//# sourceMappingURL=provider.controller.js.map