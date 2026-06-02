import express from 'express';
import multer from 'multer';
import { uploadController } from '../controllers/uploadController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Supported file types
const ALLOWED_MIMETYPES = [
  'text/csv',
  'application/vnd.ms-excel',                                                // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
  'application/pdf',
];

const ALLOWED_EXTENSIONS = ['.csv', '.xls', '.xlsx', '.pdf'];

// Configure multer with size limits and file type validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const ext = '.' + file.originalname.split('.').pop().toLowerCase();
    if (ALLOWED_MIMETYPES.includes(file.mimetype) || ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`), false);
    }
  },
});

// All routes require authentication
router.use(verifyToken);

// Single unified upload endpoint
router.post('/file', upload.single('file'), uploadController.uploadFile);

// Keep legacy CSV endpoint for backward compatibility
router.post('/csv', upload.single('file'), uploadController.uploadFile);

export default router;
