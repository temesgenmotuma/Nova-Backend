const joi = require("joi");

const providerModel = require("../Models/provider.model");
const generateToken = require("../utils/generateToken");

const employeeSchema = joi.object({
  email: joi.string().email().required(),
  name: joi.string().required(),
  password: joi.string().required().min(8),
  phone: joi
    .string()
    .pattern(/^09\d{8}$/)
    .required(),
  role: joi.string().valid("admin", "valet").optional(),
});
const providerSchema = joi.object({
  phone: joi
    .string()
    .pattern(/^09\d{8}$/)
    .required(),
  name: joi.string().required().lowercase(),
  email: joi.string().email(),
  hasValet: joi.boolean().required(),
});

const createProviderSchema = joi.object({
  employee: employeeSchema,
  provider: providerSchema,
});

exports.create = async (req, res) => {
  const { value, error } = createProviderSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const providerExists = await providerModel.getProvider(value.provider.name);
    if (providerExists)
      return res.status(409).json({ error: "The name is already taken." });

    const employee = await providerModel.create(value);
    //TODO: maybe this goes in the model in a transaction.
    const payload = {
      providerId: employee.provider.id,
      employeeId: employee.id,
      role: employee.role,
    };
    const token = generateToken(payload, res);
    
    res.json({
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating provider." });
  }
};
