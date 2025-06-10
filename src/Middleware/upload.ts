import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const uploadDir = path.join(__dirname, '../..', 'uploads', 'lots');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir); 
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now();
    cb(null, `${file.originalname}-${uniqueSuffix}` + path.extname(file.originalname)); 
  }
});

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, 
  storage: storage,
  /* fileFilter: (_req, file, cb) => {
    if (!file) {
      return cb(null, true);
    }

    const allowedTypes = /(jpeg|jpg|png|)?/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error('Only jpeg, jpg and png file formats are allowed!'));
  } */
});

export default upload;