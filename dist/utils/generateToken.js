"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateTokenSendCookie = (payload, res) => {
    const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET);
    // res.cookie("jwt", token, {
    //   sameSite: true,
    //   maxAge: 1000 * 60 * 60 * 24 * 1,
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV !== "development",
    // });
    return token;
};
exports.default = generateTokenSendCookie;
//# sourceMappingURL=generateToken.js.map