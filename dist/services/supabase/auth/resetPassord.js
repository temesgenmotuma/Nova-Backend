"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = sendResetPasswordEmail;
const supabase_1 = __importDefault(require("../supabase"));
async function sendResetPasswordEmail(email) {
    try {
        const { data, error } = await supabase_1.default.auth.resetPasswordForEmail(email);
        return { data, error };
    }
    catch (error) {
        throw error;
    }
}
//# sourceMappingURL=resetPassord.js.map