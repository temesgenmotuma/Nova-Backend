"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLotsByProvider = void 0;
const provider_model_1 = __importDefault(require("../Models/provider.model"));
const getLotsByProvider = async (req, res) => {
    const { providerId } = req.params;
    try {
        const Lots = await provider_model_1.default.getLotsByProvider(providerId);
        res.json(Lots);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching Lots.", error });
    }
};
exports.getLotsByProvider = getLotsByProvider;
//# sourceMappingURL=provider.controller.js.map