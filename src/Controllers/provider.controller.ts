import joi from "joi";
import { Request, Response } from "express";

import providerModel from "../Models/provider.model";
import generateToken from "../utils/generateToken";

const employeeSchema = joi.object({
  email: joi.string().email().required(),
  name: joi.string().required(),
  password: joi.string().required().min(8),
  phone: joi.string().pattern(/^09\d{8}$/).required(),
  role: joi.string().valid("admin", "valet").optional(),
});
const providerSchema = joi.object({
  phone: joi.string().pattern(/^09\d{8}$/).required(),
  name: joi.string().required().lowercase(),
  email: joi.string().email(),
  hasValet: joi.boolean().required(),
});

const createProviderSchema = joi.object({
  employee: employeeSchema,
  provider: providerSchema,
});

interface createProviderInterface {
  employee: Employee;
  provider: Provider;
}

export type Employee = {
  password: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
}

export type Provider = {
  email: string;
  name: string;
  phone: string;
  hasValet: boolean;
}

enum Role {
  Admin,
  Valet,
}

export const createProvider = async (req: Request, res: Response): Promise<void> => {
  const { value, error } = createProviderSchema.validate(req.body);
  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }

  try {
    const providerExists = await providerModel.getProvider(value.provider.name);
    if (providerExists) {
      res.status(409).json({ error: "The name is already taken." });
      return;
    }

    const { employee: emp, provider: prov }: createProviderInterface = value;
    const employee = await providerModel.create(emp, prov);
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


