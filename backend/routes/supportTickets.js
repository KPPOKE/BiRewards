import express from 'express';
import { createTicket, getTickets, getTicketDetails, addMessage, updateTicketStatus } from '../Controllers/supportTicketController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/', createTicket);
router.get('/', getTickets);
router.get('/:id', getTicketDetails);
router.post('/:id/messages', addMessage);
router.patch('/:id', updateTicketStatus);

export default router; 