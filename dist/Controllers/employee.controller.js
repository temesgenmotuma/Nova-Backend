"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResetEmail = exports.getUser = exports.createEmployee = exports.inviteEmployee = exports.login = exports.createProvider = void 0;
const joi_1 = __importDefault(require("joi"));
const supabase_1 = __importDefault(require("../services/supabase/supabase"));
const employee_model_1 = __importDefault(require("../Models/employee.model"));
const signUp_1 = __importDefault(require("../services/supabase/auth/signUp"));
const signIn_1 = __importDefault(require("../services/supabase/auth/signIn"));
const sendEmail_1 = __importDefault(require("../services/email/sendEmail"));
const resetPassord_1 = __importDefault(require("../services/supabase/auth/resetPassord"));
const employeeSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    name: joi_1.default.string().required(),
    password: joi_1.default.string().required().min(8),
    phone: joi_1.default.string().pattern(/^09\d{8}$/).required(),
    role: joi_1.default.string().valid("admin", "valet").optional(),
});
const providerSchema = joi_1.default.object({
    phone: joi_1.default.string().pattern(/^09\d{8}$/).required(),
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
const createEmployeeSchema = joi_1.default.object({
    name: joi_1.default.string().required(),
    phone: joi_1.default.string().pattern(/^09\d{8}$/).required(),
    password: joi_1.default.string().min(8).required(),
    confirmPassword: joi_1.default.ref("password"),
});
const resetPasswordSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    // password: joi.string().min(8).required(),
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
            res.status(404).json({
                error: "Employee not found.",
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
        res.status(500).json({ message: "Error logging in.", error });
    }
};
exports.login = login;
const inviteEmployee = async (req, res) => {
    const { error, value } = inviteEmployeeSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
    }
    const providerId = req.user?.providerId;
    try {
        const { email, role } = value;
        //dont allow adding employee who already works for another provider
        //db wide check or just provider check?
        const employee = await employee_model_1.default.getEmployeeByEmail(email);
        if (employee) {
            let message = "Employee already exists.";
            if (employee.providerId === providerId) {
                message = "Employee already works for this provider.";
            }
            res.status(409).json({ message });
            return;
        }
        //do i need to check if an unexpired inivitation already exists?
        await employee_model_1.default.createInvitation(email, role, providerId);
        //TODO: add correct email template
        await (0, sendEmail_1.default)(email);
        res.json({ message: "Invitation email sent." });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error inviting employee. ", error: error });
    }
};
exports.inviteEmployee = inviteEmployee;
const createEmployee = async (req, res) => {
    const { error, value } = createEmployeeSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
    }
    const token = req.query.token;
    try {
        const invitation = await employee_model_1.default.getInvitation(token);
        if (!invitation) {
            res.status(404).json({ message: "Invitation not found or expired" });
            return;
        }
        const employeeExists = await employee_model_1.default.getEmployeeByEmail(invitation.email);
        if (employeeExists) {
            res.status(409).json({ message: "Employee already exists." });
            return;
        }
        //supabase signup
        const user = await (0, signUp_1.default)(invitation.email, value.password);
        const empSupabaseId = user.id;
        const employee = await employee_model_1.default.createEmployee(value, invitation, empSupabaseId);
        res.status(201).json(employee);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating employee." });
    }
};
exports.createEmployee = createEmployee;
const getUser = async (req, res) => {
    // TODO: 
    try {
    }
    catch (error) {
        console.error(error);
        res.status(500).json(error);
    }
};
exports.getUser = getUser;
const sendResetEmail = async (req, res) => {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
    }
    try {
        const { email } = value;
        const user = await employee_model_1.default.getEmployeeByEmail(email);
        if (!user) {
            res.status(404).json({ message: "User not found." });
            return;
        }
        const { data, error } = await (0, resetPassord_1.default)(email);
        if (error)
            throw error;
        res.json({ message: "Reset email sent." });
    }
    catch (error) {
        console.error(error);
        res.status(500).json(error);
    }
};
exports.sendResetEmail = sendResetEmail;
//# sourceMappingURL=employee.controller.js.map