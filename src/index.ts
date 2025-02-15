import express from "express";
import fs from "node:fs";
import cors from "cors";
import yaml from "yaml";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

import customerRoutes from "./Routes/customer.js";
import providerRoutes from "./Routes/provider.js";
import lotRoutes from "./Routes/lot.js";

import swaggerUi from "swagger-ui-express";
const swaggerDocument = yaml.parse(
  fs.readFileSync(`${__dirname}/../docs/swagger.yaml`, "utf8")
);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express.json());
app.use(cors());

app.use("/v1/customers", customerRoutes);
app.use("/v1/providers", providerRoutes);
app.use("/v1/lots", lotRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
