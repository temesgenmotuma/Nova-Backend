import db from "../Db/db";
import bcrypt from "bcryptjs";
import { Customer } from "@prisma/client";

import ModelError from "./ModelError"; 

interface UserData {
  email: string;
  password: string;
  username?: string; // Make username optional
}

const customerModel = {
  async getUser(email: string) {
    return await db.customer.findUnique({
      where: {
        email,
      },
    });
  },

  async signup(email: string, password: string, username: string) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const data: UserData = {
      email,
      password: hashedPassword,
    };
    if (username) {
      data.username = username;
    }
    const customer = db.customer.create({
      data: data,
      select: {
        id: true,
        username: true,
        email: true,
      },
    });
    return customer;
  },

  async login(email: string, password: string): Promise<Customer> {
    const customer = await db.customer.findUnique({
      where: {
        email,
      }
    });
    if (customer === null) {
      throw new ModelError("Customer with that email doesn't exist.", 404);
    }
    const match = await bcrypt.compare(password, customer.password);
    if (!match) throw new ModelError("Incorrect Password Passed", 401);
    return customer;
  },
};

export default customerModel;
