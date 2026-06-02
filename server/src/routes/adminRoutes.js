import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { setApiKeys } from '../controllers/adminController.js';

const router = express.Router();

// Protected endpoint to set API keys in the running server process.
// Requires authentication and a non-free subscriptionPlan.
router.post('/keys', verifyToken, setApiKeys);

export default router;
