"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../Db/db"));
const providerModel = {
    async getProvider(name) {
        return await db_1.default.provider.findUnique({
            where: {
                name: name.toLowerCase(),
            },
        });
    },
    async create(employee, provider) {
        const password = employee.password;
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const email = employee.email;
        return await db_1.default.employee.create({
            data: {
                name: employee.name.toLowerCase(),
                phone: employee.phone,
                // passsword: hashedPassword,
                email: email,
                role: "Admin",
                supabaseId: "1234", //TODO: get from supabase
                provider: {
                    create: {
                        email: provider.email,
                        name: provider.name,
                        phone: provider.phone,
                        hasValet: provider.hasValet,
                        supabaseId: "1234", //TODO: get from supabase
                    },
                },
            },
            include: {
                provider: true,
            },
        });
    },
};
exports.default = providerModel;
//# sourceMappingURL=provider.model.js.map