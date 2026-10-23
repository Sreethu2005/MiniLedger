import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage destination and sanitized filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `receipt-${uniqueSuffix}${ext}`);
  },
});

// Allowed image MIME types
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

// Multer instance with 5MB size limit and image filter
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only image files (JPEG, PNG, WEBP) are allowed.'));
    }
  },
}).single('receipt');

/**
 * Express middleware wrapper for receipt upload.
 * Catches Multer errors (file size limits, unsupported types)
 * and returns consistent JSON errors: { error: string }.
 */
export const uploadReceiptMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  upload(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'File size exceeds maximum limit of 5MB' });
        return;
      }
      res.status(400).json({ error: `File upload error: ${err.message}` });
      return;
    } else if (err) {
      res.status(400).json({ error: err.message || 'Failed to process uploaded file' });
      return;
    }
    next();
  });
};
