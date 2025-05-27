import express from 'express';
import { createTicket, getTickets, getTicketDetails, getTicketMessages, addMessage, updateTicketStatus } from '../Controllers/supportTicketController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Ticket management routes
router.post('/', createTicket);
router.get('/', getTickets);
router.get('/:id', getTicketDetails);
router.patch('/:id', updateTicketStatus);

// Message-specific routes
router.get('/:id/messages', getTicketMessages);
router.post('/:id/messages', addMessage);

export default router; 