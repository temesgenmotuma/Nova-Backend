import jwt from "jsonwebtoken";
import { Response } from "express";

interface customerJwtPayload {
  id: string;
  email: string;
}

interface providerJwtPayload {
  providerId: string;
  employeeId: string;
  role: string;
}

const generateTokenSendCookie = (
  payload: customerJwtPayload | providerJwtPayload,
  res: Response
) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET!);
  // res.cookie("jwt", token, {
  //   sameSite: true,
  //   maxAge: 1000 * 60 * 60 * 24 * 1,
  //   httpOnly: true,
  //   secure: process.env.NODE_ENV !== "development",
  // });
  return token;
};

export default generateTokenSendCookie;
