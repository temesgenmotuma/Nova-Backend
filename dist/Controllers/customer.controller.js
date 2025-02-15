"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.signup = void 0;
const customer_model_1 = __importDefault(require("../Models/customer.model"));
const generateToken_1 = __importDefault(require("../utils/generateToken"));
const ModelError_1 = __importDefault(require("../Models/ModelError"));
// import { customerJwtPayload } from "../utils/generateToken";
const signup = async (req, res) => {
    const { email, password, username } = req.body;
    try {
        const existingUser = await customer_model_1.default.getUser(email);
        if (existingUser) {
            res.status(409).json({ message: "Customer already exits." });
            return;
        }
        const customer = await customer_model_1.default.signup(email, password, username);
        res.json(customer);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error signing up." });
    }
};
exports.signup = signup;
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const customer = await customer_model_1.default.login(email, password);
        const payload = { id: customer?.id, email: customer?.email };
        const token = (0, generateToken_1.default)(payload, res);
        res.json({ token });
    }
    catch (error) {
        console.error(error);
        if (error instanceof ModelError_1.default) {
            res.status(error.statusCode).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: "Error Logging in." });
    }
};
exports.login = login;
//# sourceMappingURL=customer.controller.js.map