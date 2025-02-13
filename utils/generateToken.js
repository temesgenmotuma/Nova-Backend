const jwt = require('jsonwebtoken');

const generateTokenSendCookie = (payload, res) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET);
  res.cookie("jwt", token, {
    sameSite: true,
    maxAge: 1000 * 60 * 60 * 24 * 1,
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
  });
  return token;
};

module.exports = generateTokenSendCookie;