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

// Support multiple methods for updating ticket status
router.patch('/:id', updateTicketStatus);
router.put('/:id', updateTicketStatus);  // Add PUT method support
router.put('/:id/status', updateTicketStatus);  // Add specific status endpoint

// Message-specific routes
router.get('/:id/messages', getTicketMessages);
router.post('/:id/messages', addMessage);

export default router; 