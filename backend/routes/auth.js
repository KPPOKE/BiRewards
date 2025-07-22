import express from 'express';
import { loginUser } from '../Controllers/userController.js';
const router = express.Router();

// Use the proper loginUser function with bcrypt password hashing
router.post('/login', loginUser);

export default router;