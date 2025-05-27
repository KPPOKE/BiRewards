import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { createApiKey, rotateApiKey, setApiKeyPermissions } from '../Controllers/apiKeyController.js';

const router = express.Router();

// All routes are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

// Create API key
router.post('/', createApiKey);

// Rotate API key
router.put('/:id/rotate', rotateApiKey);

// Set API key permissions
router.put('/:id/permissions', setApiKeyPermissions);

export default router; 