import { Request, Response } from "express";

import customerModel from "../Models/customer.model";
import generateTokenSendCookie from "../utils/generateToken";
import ModelError from "../Models/ModelError";

export const signup = async (req: Request, res: Response): Promise<void> => {
  const { email, password, username } = req.body;
  try {
    const existingUser = await customerModel.getUser(email);
    if (existingUser) {
      res.status(409).json({ message: "Customer already exits." });
      return;
    }

    const customer = await customerModel.signup(email, password, username);
    res.json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error signing up." });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const customer = await customerModel.login(email, password);
    const payload = { id: customer?.id, email: customer?.email };
    const token = generateTokenSendCookie(payload, res);
    res.json({ token });
  } catch (error) {
    console.error(error);
    if (error instanceof ModelError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Error Logging in." });
  }
};
