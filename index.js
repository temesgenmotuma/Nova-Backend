const express = require("express");
const fs = require("node:fs");
const cors = require("cors");
const yaml = require('yaml');
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

const customerRoutes = require("./Routes/customerRoute");
const providerRoutes = require("./Routes/providerRoute");

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = yaml.parse(
  fs.readFileSync(`${__dirname}/swagger.yaml`, 'utf8')
);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express.json());
app.use(cors());

app.use("/v1/auth/customers", customerRoutes);
app.use("/v1/auth/providers", providerRoutes);

app.listen(PORT, (error) => {
  if (error) return console.error(error);
  console.log(`Server running on http://localhost:${PORT}`);
});
