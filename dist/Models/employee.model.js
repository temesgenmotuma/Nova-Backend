"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../Db/db"));
const crypto_1 = __importDefault(require("crypto"));
const employeeModel = {
    async getProvider(name) {
        return await db_1.default.provider.findUnique({
            where: {
                name: name.toLowerCase(),
            },
        });
    },
    async getEmployeeByEmail(email) {
        return await db_1.default.employee.findUnique({
            where: {
                email,
            },
            include: {
                provider: true,
            }
        });
    },
    async getEmployeeBySupabaseId(supabaseId) {
        return await db_1.default.employee.findUnique({
            where: {
                supabaseId,
            },
            select: {
                id: true,
                email: true,
                role: true,
                provider: {
                    select: {
                        id: true,
                    },
                },
            },
        });
    },
    async signup(employee, provider, supabaseId) {
        const email = employee.email;
        return await db_1.default.employee.create({
            data: {
                name: employee.name.toLowerCase(),
                phone: employee.phone,
                email: email,
                role: "Admin",
                supabaseId: supabaseId,
                provider: {
                    create: {
                        ...(provider.email && { email: provider.email }),
                        name: provider.name,
                        phone: provider.phone,
                        hasValet: provider.hasValet,
                        supabaseId: supabaseId,
                    },
                },
            },
            include: {
                provider: true,
            },
        });
    },
    async createEmployee(employee, invitation, supabaseId) {
        return await db_1.default.employee.create({
            data: {
                name: employee.name,
                phone: employee.phone,
                email: invitation.email,
                role: invitation.role,
                providerId: invitation.providerId,
                supabaseId,
            },
        });
    },
    async createInvitation(email, role, providerId) {
        const token = crypto_1.default.randomBytes(32).toString("hex");
        return await db_1.default.invitation.create({
            data: {
                email,
                role: role,
                providerId,
                token,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
            }
        });
    },
    async getInvitation(token) {
        //order by date
        return await db_1.default.invitation.findFirst({
            where: {
                token,
                expiresAt: {
                    gt: new Date(Date.now()).toISOString(),
                },
            },
        });
    }
};
exports.default = employeeModel;
//# sourceMappingURL=employee.model.js.map