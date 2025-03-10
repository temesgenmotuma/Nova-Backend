"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../Db/db"));
const providerModel = {
    async getLotsByProvider(providerId) {
        return await db_1.default.lot.findMany({
            where: {
                providerId: providerId
            }
        });
    }
};
exports.default = providerModel;
//# sourceMappingURL=provider.model.js.map