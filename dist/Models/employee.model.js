"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../Db/db"));
const providerModel = {
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
    async addEmployee(email, role) {
        // return await db.employee.create({
        //   // data: {
        //   //   name:"dkjfa",
        //   //   phone:"123456789",
        //   //   providerId:"1"
        //   // },
        // });
    },
    async createInvitation(email, role, providerId) {
        return await db_1.default.invitation.create({
            data: {
                email,
                role: role,
                providerId,
                expiresAt: new Date(Date.now())
            }
        });
    }
};
exports.default = providerModel;
//# sourceMappingURL=employee.model.js.map