const bcrypt = require("bcryptjs");
const db = require("../Db/db");

module.exports = {
  async getProvider(name) {
    return await db.provider.findUnique({
      where: {
        name: name.toLowerCase(),
      },
    });
  },

  async create({ employee, provider }) {
    const password = employee.password;
    const hashedPassword = await bcrypt.hash(password, 10);
    const email = employee.email;
    return await db.employee.create({
      data: {
        name: employee.name.toLowerCase(),
        phone: employee.phone,
        passsword: hashedPassword,
        email: email,
        role: "Admin",
        provider: {
          create: {
            email: provider.email,
            name: provider.name,
            phone: provider.phone,
            hasValet: provider.hasValet,
          },
        },
      },
      include: {
        provider: true,
      },
    });
  },
};
