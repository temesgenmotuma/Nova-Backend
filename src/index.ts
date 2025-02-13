import express from "express";
import fs from "node:fs";
import cors from "cors";
import yaml from "yaml";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

import customerRoutes from "./Routes/customerRoute";
import providerRoutes from "./Routes/providerRoute";

import swaggerUi from "swagger-ui-express";
const swaggerDocument = yaml.parse(
  fs.readFileSync(`${__dirname}/../swagger.yaml`, "utf8")
);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express.json());
app.use(cors());

app.use("/v1/auth/customers", customerRoutes);
app.use("/v1/auth/providers", providerRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
