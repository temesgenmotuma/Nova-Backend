"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.signup = void 0;
const joi_1 = __importDefault(require("joi"));
const customer_model_1 = __importDefault(require("../Models/customer.model"));
const supabase_1 = __importDefault(require("../services/supabase/supabase"));
const customerSignupSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(8).required(),
    username: joi_1.default.string().min(3).allow(""),
});
const customerLoginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(8),
});
const signup = async (req, res) => {
    const { value, error } = customerSignupSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }
    const { email, password, username } = value;
    try {
        const existingUser = await customer_model_1.default.getCustomerByEmail(email);
        if (existingUser) {
            res.status(409).json({ message: "Customer already exits." });
            return;
        }
        //supabase signup
        const { data, error } = await supabase_1.default.auth.signUp({
            email: email,
            password: password,
        });
        if (error || !data?.user)
            throw error;
        //create customer
        const supabaseUserId = data.user.id;
        const customer = await customer_model_1.default.signup(email, password, username, supabaseUserId);
        res.status(201).json(customer);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error signing up." });
    }
};
exports.signup = signup;
const login = async (req, res) => {
    const { value, error } = customerLoginSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }
    const { email, password } = value;
    try {
        // const customer = await customerModel.login(email, password);
        // const payload = { id: customer?.id, email: customer?.email };
        // const token = generateTokenSendCookie(payload, res);
        // res.json({ token });
        const { data, error } = await supabase_1.default.auth.signInWithPassword({
            email: email,
            password: password,
        });
        if (error)
            throw error;
        const customer = await customer_model_1.default.getCustomerByEmail(email);
        res.json({ token: data.session.access_token, customer });
    }
    catch (error) {
        console.error(error);
        /*  if (error instanceof ModelError) {
           res.status(error.statusCode).json({ error: error.message });
           return;
         } */
        res.status(500).json({ error: "Error Logging in." });
    }
};
exports.login = login;
//# sourceMappingURL=customer.controller.js.map