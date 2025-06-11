import { Request, Response } from "express";
import joi from "joi";

import supabase from "../services/supabase/supabase";
import employeeModel from "../Models/employee.model";
import createAuthUser from "../services/supabase/auth/signUp";
import authSignin from "../services/supabase/auth/signIn";
import  supaUpdatePassword  from "../services/supabase/auth/updatePassword";
import sendEmail from "../services/email/sendEmail";
import sendResetPasswordEmail from "../services/supabase/auth/resetPassord";
import ModelError from "../Models/ModelError";

const employeeSchema = joi.object({
  email: joi.string().email().required(),
  name: joi.string().required(),
  password: joi.string().required().min(8),
  phone: joi.string().pattern(/^09\d{8}$/).required(),
  // role: joi.string().valid("admin", "valet").optional(),
});
const providerSchema = joi.object({
  phone: joi.string().pattern(/^09\d{8}$/).required(),
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
  role: joi.string().valid("Admin", "Valet", "Attendant").required(),
  lot: joi.when('role', {
    is: 'Admin',
    then: joi.optional(),
    otherwise: joi.string().uuid().required(),
  })
});

const createEmployeeSchema = joi.object({
  name: joi.string().required(),
  phone: joi.string().pattern(/^09\d{8}$/).required(),
  password: joi.string().min(8).required(),
  confirmPassword: joi.ref("password"),
});

const getEmployeesSchema = joi.object({
 lotId : joi.string().uuid(),
 offset: joi.number().integer().min(0).default(0),
 limit: joi.number().integer().min(1).max(100).default(1),
}
);

const resetPasswordSchema = joi.object({
  email: joi.string().email().required(),
  // password: joi.string().min(8).required(),
})

const updatePasswordSchema = joi.object({
  password: joi.string().min(8).required(),
  confirmPassword: joi.ref("password"),
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
    const providerExists = await employeeModel.getProvider(value.provider.name);
    if (providerExists) {
      res.status(409).json({ error: "The name is already taken." });
      return;
    }

    const { employee: emp, provider: prov }: createProviderInterface = value;

    //sign up employee in supabase
    const user = await createAuthUser(emp.email, emp.password);
    const employeeSupabaseId = user.id;

    //create employee and provider in db
    const employee = await employeeModel.signup(emp, prov, employeeSupabaseId);

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
    if(error instanceof ModelError){
      res.status(error.statusCode).json({message: error.message});
      return;
    }
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
    const employeeExists = await employeeModel.getEmployeeByEmail(value.email);
    if (!employeeExists || !employeeExists.provider) {
      res.status(404).json({
        error: "Employee not found.",
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
    res.status(500).json({ message: "Error logging in.", error });
  }
};

export const inviteEmployee = async (req: Request, res: Response) => {
  const { error, value } = inviteEmployeeSchema.validate(req.body);
  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }
  const providerId = req.user?.providerId!;
  try {
    const { email, role, lot } = value;
    //dont allow adding employee who already works for another provider

    //db wide check or just provider check?
    const employee = await employeeModel.getEmployeeByEmail(email);
    if (employee) {
      let message = "Employee already exists.";
      if (employee.providerId === providerId) {
        message = "Employee already works for this provider.";
      }
      res.status(409).json({ message });
      return;
    }

    //do i need to check if an unexpired inivitation already exists?
    const { token } = await employeeModel.createInvitation(email, role, providerId, lot);

  await sendEmail(
    email,
    "Invitation to join the parking management system",
    `<html>
      <body>
        <p>You have been invited to join the parking management system. Please click the link below to accept the invitation:</p>
        <a href="http://localhost:5173/add-employee?token=${token}">http://localhost:5173/add-employee?token=${token}</a>
        <p>Hello</p>
      </body>
    </html>`
  );
    res.json({ message: "Invitation email sent." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error inviting employee. ", error: error });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  const { error, value } = createEmployeeSchema.validate(req.body);
  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }

  if(!req.query.token){
    res.status(400).json({ message: "Token not provided."});
    return;
  }
  const token = req.query.token as string;
  try {
    const invitation = await employeeModel.getInvitation(token);
    if(!invitation){
      res.status(404).json({message:"Invitation not found or expired"});
      return;
    }

    const employeeExists = await employeeModel.getEmployeeByEmail(invitation.email);
    if(employeeExists){
      res.status(409).json({message:"Employee already exists."});
      return;
    }

    //supabase signup
    const user = await createAuthUser(invitation.email, value.password);
    const empSupabaseId = user.id;

    const employee = await employeeModel.createEmployee(value, invitation, empSupabaseId);
    res.status(201).json(employee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating employee." });
  }
}

export const getUser = async(req: Request, res: Response) => {
  // TODO: 
  try {
    
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
};

export const getEmployees = async(req: Request, res: Response) => {
  const providerId = req.user?.providerId!;
  const {value, error} = getEmployeesSchema.validate(req.query);
  //NOTE: lotId is a dropdown or a filter
  if(req.user?.role.toLowerCase() !== "admin"){
    res.status(403).json({ message: "Forbidden. Only admins can access this resource." });
    return;
  }
  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }
  const {lotId, limit, offset} = value;
  try {
    const employees = await employeeModel.getEmployees(lotId, providerId, limit, offset);
    res.json(employees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching employees.", error });
  }
}

export const sendResetEmail = async(req: Request, res: Response) => {
  const { error, value } = resetPasswordSchema.validate(req.body);
  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }
  try {
    const { email} = value;
    const user = await employeeModel.getEmployeeByEmail(email);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const { data, error } = await sendResetPasswordEmail(email);
    if (error) throw error;

    res.json({ message: "If an account with that email exists, a password reset link has been sent"});
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
}

export const updatePassword = async (req: Request, res: Response) => {
  const { error, value } = updatePasswordSchema.validate(req.body);

  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }

  try {
    const user = await employeeModel.getEmployeeByEmail(req.user?.email!);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    await supaUpdatePassword(value.password);
    res.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating password.", error });
  }
}
