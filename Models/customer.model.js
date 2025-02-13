const db = require("../Db/db");
const bcrypt = require("bcryptjs");

const ModelError = require("./ModelError");

module.exports = {
  async getUser(email) {
    return await db.customer.findUnique({
      where: {
        email,
      },
    });
  },

  async signup({ email, password, username }) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const data = {
      email,
      password: hashedPassword,
    };
    if (username) {
      data.username = username;
    }
    const customer = db.Customer.create({
      data: data,
      select: {
        id: true,
        username: true,
        email: true,
      },
    });
    return customer;
  },

  async login(email, password) {
    const customer = await db.customer.findUnique({
      where: {
        email,
      },
      select: {
        password: true,
      },
    });
    const match = await bcrypt.compare(password, customer.password);
    if (!match) throw new ModelError("Incorrect Password Passed", 401);
  },
};
