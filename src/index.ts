import express from "express";
import fs from "node:fs";
import cors from "cors";
import yaml from "yaml";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

import customerRoutes from "./Routes/customer";
import employeeRoutes from "./Routes/employee";
import lotRoutes from "./Routes/lot";
import spotRoutes from "./Routes/spot";
import providerRoutes from "./Routes/provider";
import vehicleRoutes from "./Routes/vehicle";
import reservationRoutes from "./Routes/reservation";

import swaggerUi from "swagger-ui-express";
const swaggerDocument = yaml.parse(
  fs.readFileSync(`${__dirname}/../docs/swagger.yaml`, "utf8")
);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express.json());
app.use(cors());

app.use("/v1/customer", customerRoutes);
app.use("/v1/auth/employees", employeeRoutes);
app.use("/v1/provider", providerRoutes);
app.use("/v1/lots", lotRoutes);
app.use("/v1/spots", spotRoutes);
app.use("/v1/vehicles", vehicleRoutes);
app.use("/v1/reservations", reservationRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
