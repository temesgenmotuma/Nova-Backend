import express from "express";
import fs from "node:fs";
import cors from "cors";
import yaml from "yaml";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

import customerRoutes from "./Routes/customer";
import providerRoutes from "./Routes/employee";
import lotRoutes from "./Routes/lot";
import spotRoutes from "./Routes/spot";

import swaggerUi from "swagger-ui-express";
const swaggerDocument = yaml.parse(
  fs.readFileSync(`${__dirname}/../docs/swagger.yaml`, "utf8")
);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express.json());
app.use(cors());

app.use("/v1/customer", customerRoutes);
app.use("/v1/provider", providerRoutes);
app.use("/v1/lots", lotRoutes);
app.use("/v1/spots", spotRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
