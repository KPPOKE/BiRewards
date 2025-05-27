import express from 'express';
import { 
  getTags, 
  createTag, 
  addTagsToUser, 
  removeTagFromUser, 
  getUserTags,
  addCustomerNote,
  getCustomerNotes,
  getCustomerActivity,
  updateTicketPriority,
  submitSatisfactionRating
} from '../Controllers/customerController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Customer tags routes
router.get('/tags', getTags);
router.post('/tags', createTag);
router.get('/users/:userId/tags', getUserTags);
router.post('/users/:userId/tags', addTagsToUser);
router.delete('/users/:userId/tags/:tagId', removeTagFromUser);

// Customer notes routes
router.get('/users/:userId/notes', getCustomerNotes);
router.post('/users/:userId/notes', addCustomerNote);

// Customer activity routes
router.get('/users/:userId/activity', getCustomerActivity);

// Ticket enhancement routes
router.patch('/tickets/:ticketId/priority', updateTicketPriority);
router.post('/tickets/:ticketId/satisfaction', submitSatisfactionRating);

export default router;
