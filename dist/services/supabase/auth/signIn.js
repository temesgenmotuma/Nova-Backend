"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authSignin;
const supabase_1 = __importDefault(require("../supabase"));
async function authSignin(email, password) {
    const { data, error } = await supabase_1.default.auth.signInWithPassword({
        email: email,
        password: password,
    });
    if (error || !data?.session)
        throw error;
    return data.session.access_token;
}
//# sourceMappingURL=signIn.js.map