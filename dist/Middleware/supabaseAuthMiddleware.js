"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = protect;
const supabase_1 = __importDefault(require("../services/supabase/supabase"));
const customer_model_1 = __importDefault(require("../Models/customer.model"));
const employee_model_1 = __importDefault(require("../Models/employee.model"));
async function protect(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.error("Unauthorized: No authorization header provided.");
        res.status(401).json({ message: "Unauthorized: No authorization header provided." });
        return;
    }
    const accessToken = authHeader.split(" ")[1];
    try {
        const { data, error } = await supabase_1.default.auth.getUser(accessToken);
        if (error) {
            console.error("Failed to get supabase auth user", error);
            res.status(401).json({ message: "Unauthorized: Supabase sign in failed." });
            return;
        }
        const supaId = data.user.id;
        let user;
        const clientType = req.headers["x-client-type"];
        if (clientType === "customer") {
            user = await customer_model_1.default.getCustomerBySupabaseId(supaId);
            if (!user) {
                res.status(404).json({ message: "User not found" });
                return;
            }
            req.user = {
                id: user?.id,
                email: user?.email,
            };
        }
        else if (clientType === "provider") {
            user = await employee_model_1.default.getEmployeeBySupabaseId(supaId);
            if (!user) {
                res.status(404).json({ message: "User not found" });
                return;
            }
            req.user = {
                id: user?.id,
                providerId: user?.provider.id,
                role: user?.role,
                email: user?.email,
            };
        }
        else {
            console.error("Invalid client-type header provided.");
            res.status(401).json({ message: "No client-type header provided." });
            return;
        }
        next();
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error authenticating user." });
    }
}
//# sourceMappingURL=supabaseAuthMiddleware.js.map