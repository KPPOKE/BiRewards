import pool from '../db.js';

// Helper function to normalize data formats
const normalizeMessage = (message) => {
  if (!message) return null;
  
  // Create a new object to avoid reference issues
  return {
    ...message,
    // Always convert is_staff to a pure boolean value
    is_staff: Boolean(message.is_staff),
    // Ensure created_at is a consistent string format
    created_at: message.created_at ? new Date(message.created_at).toISOString() : null,
    // Ensure the message has a user_name if missing
    user_name: message.user_name || 'Unknown User'
  };
};

// Create a new support ticket
export const createTicket = async (req, res) => {
  const { subject, message } = req.body;
  const userId = req.user.id;
  try {
    const ticketResult = await pool.query(
      'INSERT INTO support_tickets (user_id, subject, status) VALUES ($1, $2, $3) RETURNING *',
      [userId, subject, 'open']
    );
    const ticket = ticketResult.rows[0];
    await pool.query(
      'INSERT INTO support_ticket_messages (ticket_id, sender_id, message) VALUES ($1, $2, $3)',
      [ticket.id, userId, message]
    );
    res.status(201).json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get tickets (user: own, admin/manager: all)
export const getTickets = async (req, res) => {
  const userId = req.user.id;
  const isAuthorized = req.user.role === 'admin' || req.user.role === 'manager';
  try {
    let result;
    
    if (isAuthorized) {
      // For admin and manager roles, get all tickets
      result = await pool.query(
        `SELECT st.*, u.name as user_name, u.email as user_email 
         FROM support_tickets st 
         LEFT JOIN users u ON st.user_id = u.id 
         ORDER BY st.created_at DESC`
      );
    } else {
      // For regular users, only get their own tickets
      result = await pool.query(
        `SELECT st.*, u.name as user_name, u.email as user_email 
         FROM support_tickets st 
         LEFT JOIN users u ON st.user_id = u.id 
         WHERE st.user_id = $1 
         ORDER BY st.created_at DESC`, 
        [userId]
      );
    }
    
    res.json({ success: true, tickets: result.rows });
  } catch (err) {
    console.error('Error fetching tickets:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get ticket details and messages
export const getTicketDetails = async (req, res) => {
  const ticketId = req.params.id;
  const userId = req.user.id;
  const isAuthorized = req.user.role === 'admin' || req.user.role === 'manager';
  try {
    // Get ticket with user information
    const ticketResult = await pool.query(
      `SELECT st.*, u.name as user_name, u.email as user_email 
       FROM support_tickets st 
       LEFT JOIN users u ON st.user_id = u.id 
       WHERE st.id = $1`, 
      [ticketId]
    );
    
    const ticket = ticketResult.rows[0];
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
    
    // Check permissions
    if (!isAuthorized && ticket.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    
    // Get messages with user information
    const messagesResult = await pool.query(
      `SELECT m.*, u.name as user_name 
       FROM support_ticket_messages m 
       LEFT JOIN users u ON m.sender_id = u.id 
       WHERE m.ticket_id = $1 
       ORDER BY m.created_at ASC`, 
      [ticketId]
    );
    
    // Normalize data to prevent client-side issues
    const normalizedMessages = messagesResult.rows.map(msg => normalizeMessage(msg));
    
    res.json({ success: true, ticket, messages: normalizedMessages });
  } catch (err) {
    console.error('Error fetching ticket details:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get only messages for a ticket - dedicated endpoint to prevent infinite loops
export const getTicketMessages = async (req, res) => {
  const ticketId = req.params.id;
  const userId = req.user.id;
  const isAuthorized = req.user.role === 'admin' || req.user.role === 'manager';
  
  try {
    // First check if ticket exists and user has permission to view it
    const ticketResult = await pool.query('SELECT * FROM support_tickets WHERE id = $1', [ticketId]);
    const ticket = ticketResult.rows[0];
    
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }
    
    if (!isAuthorized && ticket.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    
    // Get messages with user information
    const messagesResult = await pool.query(
      `SELECT m.*, u.name as user_name 
       FROM support_ticket_messages m 
       LEFT JOIN users u ON m.sender_id = u.id 
       WHERE m.ticket_id = $1 
       ORDER BY m.created_at ASC`, 
      [ticketId]
    );
    
    // Normalize data to prevent client-side issues
    const normalizedMessages = messagesResult.rows.map(msg => normalizeMessage(msg));
    
    // Return only the messages, not the ticket details
    res.json({
      success: true,
      messages: normalizedMessages
    });
  } catch (err) {
    console.error('Error fetching ticket messages:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Add a message to a ticket
export const addMessage = async (req, res) => {
  const ticketId = req.params.id;
  const userId = req.user.id;
  const { message, is_staff } = req.body;
  const isAuthorized = req.user.role === 'admin' || req.user.role === 'manager';
  
  try {
    // Check ticket ownership or admin/manager
    const ticketResult = await pool.query('SELECT * FROM support_tickets WHERE id = $1', [ticketId]);
    const ticket = ticketResult.rows[0];
    
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }
    
    if (ticket.user_id !== userId && !isAuthorized) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    
    // Insert the message
    const messageResult = await pool.query(
      'INSERT INTO support_ticket_messages (ticket_id, sender_id, message, is_staff) VALUES ($1, $2, $3, $4) RETURNING *', 
      [ticketId, userId, message, isAuthorized ? true : false]
    );
    
    // Get user info for the new message
    const userResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
    const userName = userResult.rows[0]?.name || 'Unknown User';
    
    // Return the newly created message with user info
    const newMessage = {
      ...messageResult.rows[0],
      user_name: userName
    };
    
    res.status(201).json({ success: true, message: newMessage });
  } catch (err) {
    console.error('Error adding message:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update ticket status (admin or manager)
export const updateTicketStatus = async (req, res) => {
  const ticketId = req.params.id;
  const { status } = req.body;
  const isAuthorized = req.user.role === 'admin' || req.user.role === 'manager';
  
  if (!isAuthorized) {
    return res.status(403).json({ success: false, error: 'Forbidden: Only admins and managers can update ticket status' });
  }
  
  try {
    // Update the ticket status and return the updated ticket
    const updateResult = await pool.query(
      'UPDATE support_tickets SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', 
      [status, ticketId]
    );
    
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }
    
    // Get user info for the updated ticket
    const updatedTicket = updateResult.rows[0];
    const userResult = await pool.query('SELECT name, email FROM users WHERE id = $1', [updatedTicket.user_id]);
    
    if (userResult.rows.length > 0) {
      updatedTicket.user_name = userResult.rows[0].name;
      updatedTicket.user_email = userResult.rows[0].email;
    }
    
    res.json({ success: true, ticket: updatedTicket });
  } catch (err) {
    console.error('Error updating ticket status:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}; 