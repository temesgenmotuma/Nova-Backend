import express from "express";
import fs from "node:fs";
import path from "node:path";
import cors from "cors";
import yaml from "yaml";
import dotenv from "dotenv";
import "./cron/cron";  
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
import zoneRoutes from "./Routes/zone";
import valetRoutes from "./Routes/valet";
import alertRoutes from "./Routes/alert";
import reviewRoutes from "./Routes/review";
import analyticsRoutes from "./Routes/analytics";

import swaggerUi from "swagger-ui-express";
const swaggerDocument = yaml.parse(
  fs.readFileSync(`${__dirname}/../docs/swagger.yaml`, "utf8")
);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express.json());
app.use(cors());

const uploadDir = path.join(__dirname, '..', 'uploads', 'lots');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true }); 
}
app.use('/uploads/lots', express.static(uploadDir));


app.use("/v1/customer", customerRoutes);
app.use("/v1/employees", employeeRoutes);
app.use("/v1/provider", providerRoutes);
app.use("/v1/lots", lotRoutes);
app.use("/v1/spots", spotRoutes);
app.use("/v1/zones", zoneRoutes);
app.use("/v1/vehicles", vehicleRoutes);
app.use("/v1/reservations", reservationRoutes);
app.use("/v1/valet", valetRoutes);
app.use("/v1/alerts", alertRoutes);
app.use("/v1/reviews", reviewRoutes);
app.use("/v1/analytics", analyticsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
