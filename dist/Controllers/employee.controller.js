"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addEmployee = exports.login = exports.createProvider = void 0;
const joi_1 = __importDefault(require("joi"));
const supabase_1 = __importDefault(require("../services/supabase/supabase"));
const employee_model_1 = __importDefault(require("../Models/employee.model"));
const signUp_1 = __importDefault(require("../services/supabase/auth/signUp"));
const signIn_1 = __importDefault(require("../services/supabase/auth/signIn"));
const sendEmail_1 = __importDefault(require("../services/email/sendEmail"));
const employeeSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    name: joi_1.default.string().required(),
    password: joi_1.default.string().required().min(8),
    phone: joi_1.default
        .string()
        .pattern(/^09\d{8}$/)
        .required(),
    role: joi_1.default.string().valid("admin", "valet").optional(),
});
const providerSchema = joi_1.default.object({
    phone: joi_1.default
        .string()
        .pattern(/^09\d{8}$/)
        .required(),
    name: joi_1.default.string().required().lowercase(),
    email: joi_1.default.string().email().optional(),
    hasValet: joi_1.default.boolean().required(),
});
const createProviderSchema = joi_1.default.object({
    employee: employeeSchema,
    provider: providerSchema,
});
const employeeLoginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(8).required(),
});
const inviteEmployeeSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    role: joi_1.default.string().valid("Admin", "Valet").required(),
});
var Role;
(function (Role) {
    Role[Role["Admin"] = 0] = "Admin";
    Role[Role["Valet"] = 1] = "Valet";
})(Role || (Role = {}));
const createProvider = async (req, res) => {
    const { value, error } = createProviderSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
    }
    try {
        const providerExists = await employee_model_1.default.getProvider(value.provider.name);
        if (providerExists) {
            res.status(409).json({ error: "The name is already taken." });
            return;
        }
        const { employee: emp, provider: prov } = value;
        //sign up employee in supabase
        const user = await (0, signUp_1.default)(emp.email, emp.password);
        const employeeSupabaseId = user.id;
        //create employee and provider in db
        const employee = await employee_model_1.default.signup(emp, prov, employeeSupabaseId);
        //sign in user in supabase
        const token = await (0, signIn_1.default)(emp.email, emp.password);
        //TODO: maybe this goes in the model in a transaction.
        res.status(201).json({
            token: token,
            emplyee: {
                id: employee.id,
                name: employee.name,
            },
            provider: {
                id: employee.provider.id,
                name: employee.provider.name,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error creating provider." });
    }
};
exports.createProvider = createProvider;
//for all types of employee
const login = async (req, res) => {
    const { value, error } = employeeLoginSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
    }
    try {
        //check if employee exists
        const employeeExists = await employee_model_1.default.getEmployeeByEmail(value.email);
        if (!employeeExists || !employeeExists.provider) {
            res
                .status(404)
                .json({
                error: "Employee not found or not associated with a provider.",
            });
            return;
        }
        //sign in to supabase
        const { data, error } = await supabase_1.default.auth.signInWithPassword({
            email: value.email,
            password: value.password,
        });
        if (error)
            throw error;
        //return token from supabase
        res.json({ token: data.session.access_token });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error   in.", error });
    }
};
exports.login = login;
const addEmployee = async (req, res) => {
    const { error, value } = inviteEmployeeSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
    }
    const providerId = req?.user?.providerId;
    try {
        const { email, role } = value;
        //dont allow adding employee who already works for another provider
        //need to pass on email and role to the frontend and get it back in another controller
        //db wide check or just provider check?
        const employee = await employee_model_1.default.getEmployeeByEmail(email);
        if (employee) {
            res.status(409).json({ message: "Employee already exists." });
            return;
        }
        //create an invitation record for the email
        //do i need to check if an inivitation already exists?
        const invitation = await employee_model_1.default.createInvitation(email, role, providerId);
        //send invitation email to the email addr
        await (0, sendEmail_1.default)(email, "");
        res.json({ message: "Invitation sent." });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error inviting employee. ", error: error });
    }
};
exports.addEmployee = addEmployee;
//# sourceMappingURL=employee.controller.js.map