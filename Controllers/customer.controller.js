const jwt = require("jsonwebtoken");

const customerModel = require("../Models/customer.model");
const generateTokenSendCookie = require("../utils/generateToken");
const ModelError = require("../Models/ModelError");

exports.signup = async (req, res) => {
  const { email } = req.body;

  try {
    const existingUser = await customerModel.getUser(email);
    if (existingUser)
      return res.status(409).json({ message: "Customer already exits." });
    const customer = await customerModel.signup(req.body);
    res.json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error signing up." });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const customer = await customerModel.getUser(email);
    if (!customer)
      return res.status(404).json({ message: "User doesn't exist." });
    await customerModel.login(email, password);
    const payload = { id: customer.id, email: customer.email };
    const token = generateTokenSendCookie(payload, res);
    res.json({token});
  } catch (error) {
    console.error(error);
    if (error instanceof ModelError)
      return res.status(error.statusCode).json({ error: error.message });
    res.status(500).json({ error: "Error Logging in." });
  }
};
