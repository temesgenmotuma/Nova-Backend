"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createAuthUser;
const supabase_1 = __importDefault(require("../supabase"));
const ModelError_1 = __importDefault(require("../../../Models/ModelError"));
async function createAuthUser(email, password) {
    const { data, error } = await supabase_1.default.auth.signUp({
        email: email,
        password: password,
    });
    if (error || !data?.user)
        throw new ModelError_1.default(error?.message, parseInt(error?.code) || 500);
    return data.user;
}
//# sourceMappingURL=signUp.js.map