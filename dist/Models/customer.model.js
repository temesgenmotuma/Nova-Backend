"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../Db/db"));
const ModelError_js_1 = __importDefault(require("./ModelError.js"));
const customerModel = {
    async getCustomerByEmail(email) {
        return await db_1.default.customer.findUnique({
            where: {
                email,
            },
        });
    },
    async getCustomerBySupabaseId(supabaseId) {
        return await db_1.default.customer.findUnique({
            where: {
                supabaseId,
            }
        });
    },
    async signup(email, password, username, supabaseUserId) {
        // const salt = await bcrypt.genSalt(10);
        // const hashedPassword = await bcrypt.hash(password, salt);
        const data = {
            email,
            // password: hashedPassword,
            supabaseId: supabaseUserId,
        };
        if (username) {
            data.username = username;
        }
        const customer = db_1.default.customer.create({
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
        const customer = await db_1.default.customer.findUnique({
            where: {
                email,
            }
        });
        if (customer === null) {
            throw new ModelError_js_1.default("Customer with that email doesn't exist.", 404);
        }
        // const match = await bcrypt.compare(password, customer.password);
        // if (!match) throw new ModelError("Incorrect Password Passed", 401);
        return customer;
    },
};
exports.default = customerModel;
//# sourceMappingURL=customer.model.js.map