"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const node_fs_1 = __importDefault(require("node:fs"));
const cors_1 = __importDefault(require("cors"));
const yaml_1 = __importDefault(require("yaml"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const customer_1 = __importDefault(require("./Routes/customer"));
const employee_1 = __importDefault(require("./Routes/employee"));
const lot_1 = __importDefault(require("./Routes/lot"));
const spot_1 = __importDefault(require("./Routes/spot"));
const provider_1 = __importDefault(require("./Routes/provider"));
const vehicle_1 = __importDefault(require("./Routes/vehicle"));
const reservation_1 = __importDefault(require("./Routes/reservation"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swaggerDocument = yaml_1.default.parse(node_fs_1.default.readFileSync(`${__dirname}/../docs/swagger.yaml`, "utf8"));
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument));
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use("/v1/customer", customer_1.default);
app.use("/v1/auth/employees", employee_1.default);
app.use("/v1/provider", provider_1.default);
app.use("/v1/lots", lot_1.default);
app.use("/v1/spots", spot_1.default);
app.use("/v1/vehicles", vehicle_1.default);
app.use("/v1/reservations", reservation_1.default);
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map