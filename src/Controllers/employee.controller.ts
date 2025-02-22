import joi from "joi";
import { Request, Response } from "express";

import supabase from "../services/supabase/supabase";
import providerModel from "../Models/employee.model";
import createAuthUser from "../services/supabase/auth/signUp";
import authSignin from "../services/supabase/auth/signIn";
import sendEmail from "../services/email/sendEmail";

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
  email: joi.string().email().optional(),
  hasValet: joi.boolean().required(),
});

const createProviderSchema = joi.object({
  employee: employeeSchema,
  provider: providerSchema,
});

const employeeLoginSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().min(8).required(),
});

const inviteEmployeeSchema = joi.object({
  email: joi.string().email().required(),
  role: joi.string().valid("Admin", "Valet").required(),
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
};

export type Provider = {
  email: string;
  name: string;
  phone: string;
  hasValet: boolean;
};

enum Role {
  Admin,
  Valet,
}

export const createProvider = async (req: Request, res: Response) => {
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

    //sign up employee in supabase
    const user = await createAuthUser(emp.email, emp.password);
    const employeeSupabaseId = user.id;

    //create employee and provider in db
    const employee = await providerModel.signup(emp, prov, employeeSupabaseId);

    //sign in user in supabase
    const token = await authSignin(emp.email, emp.password);

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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating provider." });
  }
};

//for all types of employee
export const login = async (req: Request, res: Response) => {
  const { value, error } = employeeLoginSchema.validate(req.body);
  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }

  try {
    //check if employee exists
    const employeeExists = await providerModel.getEmployeeByEmail(value.email);
    if (!employeeExists || !employeeExists.provider) {
      res.status(404).json({
        error: "Employee not found or not associated with a provider.",
      });
      return;
    }

    //sign in to supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: value.email,
      password: value.password,
    });
    if (error) throw error;

    //return token from supabase
    res.json({ token: data.session.access_token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error   in.", error });
  }
};

export const addEmployee = async (req: Request, res: Response) => {
  const { error, value } = inviteEmployeeSchema.validate(req.body);
  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }

  const providerId = req?.user?.providerId as string;
  try {
    const { email, role } = value;
    //dont allow adding employee who already works for another provider
    //need to pass on email and role to the frontend and get it back in another controller

    //db wide check or just provider check?
    const employee = await providerModel.getEmployeeByEmail(email);
    if (employee) {
      res.status(409).json({ message: "Employee already exists." });
      return;
    }

    //create an invitation record for the email
    //do i need to check if an unexpired inivitation already exists?
    await providerModel.createInvitation(email, role, providerId);

    //send invitation email to the email addr
    await sendEmail(email, "");
    res.json({ message: "Invitation sent." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error inviting employee. ", error: error });
  }
};
