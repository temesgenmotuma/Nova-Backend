import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";

import {
  createLot,
  getNearbylots,
  getSpotsByLot,
  getLotsOfCurrProvider,
  getZonesByLot,
  // uploadLotImage
} from "../Controllers/lot.controller";
import { createZone } from "../Controllers/zone.controller";
import protect from "../Middleware/supabaseAuthMiddleware";

const uploadDir = path.join(__dirname, '../..', 'uploads', 'lots');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now();
    cb(null, `${file.originalname}-${uniqueSuffix}` + path.extname(file.originalname)); 
  }
});

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, 
  storage: storage,
});

const router = express.Router();

// router.post("/:lotId/images", protect(["provider"]), upload.single("image"), uploadLotImage);

router.get("/", protect(["provider"]), getLotsOfCurrProvider);
router.post("/", protect(["provider"]), upload.array('images'), createLot);
router.get("/nearby", protect(["customer"]), getNearbylots)

router.get("/:lotId/spots", protect(["provider"]), getSpotsByLot);

router.post("/:lotId/zones", protect(["provider"]), createZone);
router.get("/:lotId/zones", protect(["provider", "customer"]), getZonesByLot);


export default router;
