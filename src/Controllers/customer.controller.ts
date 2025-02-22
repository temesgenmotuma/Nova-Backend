import { Request, Response } from "express";
import joi from "joi";

import customerModel from "../Models/customer.model";
import generateTokenSendCookie from "../utils/generateToken";
import ModelError from "../Models/ModelError";
import supabase from "../services/supabase/supabase";

const customerSignupSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().min(8).required(),
  username: joi.string().min(3).allow(""),
});

const customerLoginSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().min(8),
});

export const signup = async (req: Request, res: Response): Promise<void> => {
  const { value, error } = customerSignupSchema.validate(req.body);
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }
  const { email, password, username } = value;
  
  try {
    const existingUser = await customerModel.getCustomerByEmail(email);
    if (existingUser) {
      res.status(409).json({ message: "Customer already exits." });
      return;
    }

    //supabase signup
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    if (error || !data?.user ) throw error;

    //create customer
    const supabaseUserId: string = data.user.id;
    const customer = await customerModel.signup(
      email,
      password,
      username,
      supabaseUserId
    );
    res.status(201).json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error signing up." });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
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

    const {data, error} = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) throw error;

    const customer = await customerModel.getCustomerByEmail(email);
    res.json({token: data.session.access_token, customer});
  } catch (error) {
    console.error(error);
   /*  if (error instanceof ModelError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    } */
    res.status(500).json({ error: "Error Logging in." });
  }
};
