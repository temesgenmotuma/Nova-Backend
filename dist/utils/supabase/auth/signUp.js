"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createAuthUser;
const supabase_1 = __importDefault(require("../supabase"));
async function createAuthUser(email, password) {
    const { data, error } = await supabase_1.default.auth.signUp({
        email: email,
        password: password,
    });
    if (error || !data?.user)
        throw error;
    return data.user;
}
//# sourceMappingURL=signUp.js.map