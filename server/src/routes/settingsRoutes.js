import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { settingsController } from '../controllers/settingsController.js';

const router = express.Router();

router.use(verifyToken);
router.get('/api-key', settingsController.getApiKey);
router.post('/api-key', settingsController.saveApiKey);

export default router;
