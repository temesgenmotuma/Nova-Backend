"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const provider_controller_1 = require("../Controllers/provider.controller");
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/:providerId/lots', provider_controller_1.getLotsByProvider);
exports.default = router;
//# sourceMappingURL=provider.js.map