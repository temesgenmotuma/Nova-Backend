"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_js_1 = __importDefault(require("../Db/db.js"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const ModelError_js_1 = __importDefault(require("./ModelError.js"));
const customerModel = {
    async getUser(email) {
        return await db_js_1.default.customer.findUnique({
            where: {
                email,
            },
        });
    },
    async signup(email, password, username) {
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const data = {
            email,
            password: hashedPassword,
        };
        if (username) {
            data.username = username;
        }
        const customer = db_js_1.default.customer.create({
            data: data,
            select: {
                id: true,
                username: true,
                email: true,
            },
        });
        return customer;
    },
    async login(email, password) {
        const customer = await db_js_1.default.customer.findUnique({
            where: {
                email,
            }
        });
        if (customer === null) {
            throw new ModelError_js_1.default("Customer with that email doesn't exist.", 404);
        }
        const match = await bcryptjs_1.default.compare(password, customer.password);
        if (!match)
            throw new ModelError_js_1.default("Incorrect Password Passed", 401);
        return customer;
    },
};
exports.default = customerModel;
//# sourceMappingURL=customer.model.js.map