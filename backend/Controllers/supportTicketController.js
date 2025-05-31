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
  const { subject, message, category, priority } = req.body;
  const userId = req.user.id;
  try {
    // Use category and priority if provided, otherwise use defaults
    const ticketResult = await pool.query(
      'INSERT INTO support_tickets (user_id, subject, status, category, priority) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, subject, 'open', category || 'general', priority || 'medium']
    );
    const ticket = ticketResult.rows[0];
    await pool.query(
      'INSERT INTO support_ticket_messages (ticket_id, sender_id, message) VALUES ($1, $2, $3)',
      [ticket.id, userId, message]
    );
    
    // Log this activity in customer_activity
    await pool.query(
      'INSERT INTO customer_activity (user_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4)',
      [userId, 'ticket_created', `Created support ticket: ${subject}`, JSON.stringify({ ticket_id: ticket.id })]
    );
    
    res.status(201).json({ success: true, ticket });
  } catch (err) {
    console.error('Error creating ticket:', err);
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
    
    console.log('Tickets returned to frontend:', result.rows);
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
    
    // Log this activity in customer_activity
    const activityType = isAuthorized ? 'staff_reply' : 'customer_reply';
    const description = isAuthorized 
      ? `Staff member ${userName} replied to ticket` 
      : `Customer replied to ticket`;
    
    await pool.query(
      'INSERT INTO customer_activity (user_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4)',
      [
        ticket.user_id, // Always log against the customer's ID
        activityType,
        description,
        JSON.stringify({ 
          ticket_id: ticketId, 
          message_id: newMessage.id,
          is_staff: isAuthorized
        })
      ]
    );
    
    res.status(201).json({ success: true, message: newMessage });
  } catch (err) {
    console.error('Error adding message:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update ticket status (admin or manager)
export const updateTicketStatus = async (req, res) => {
  const ticketId = req.params.id;
  let status;
  
  // Handle different request formats
  if (req.body.status) {
    // Standard format: { status: 'value' }
    status = req.body.status;
  } else if (req.body.id && req.body.status === undefined) {
    // If client sent the ID but no status, look for status in other fields
    status = req.body.newStatus || req.body.ticketStatus || 'open';
  } else {
    // Try to extract status from the entire body if it's a simple value
    const bodyKeys = Object.keys(req.body);
    if (bodyKeys.length === 1 && ['open', 'in progress', 'resolved', 'closed'].includes(req.body[bodyKeys[0]])) {
      status = req.body[bodyKeys[0]];
    } else {
      // Default to the first status-like field we can find
      status = req.body.status || req.body.newStatus || req.body.ticketStatus || 'open';
    }
  }
  
  // Log the received data for debugging
  console.log('Updating ticket status:', { ticketId, receivedBody: req.body, extractedStatus: status });
  
  const isAuthorized = req.user.role === 'admin' || req.user.role === 'manager';
  const staffId = req.user.id;
  
  if (!isAuthorized) {
    return res.status(403).json({ success: false, error: 'Forbidden: Only admins and managers can update ticket status' });
  }
  
  // Validate status value
  const validStatuses = ['open', 'in progress', 'resolved', 'closed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      success: false, 
      error: `Invalid status value. Must be one of: ${validStatuses.join(', ')}` 
    });
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
    
    // Get staff info
    const staffResult = await pool.query('SELECT name FROM users WHERE id = $1', [staffId]);
    const staffName = staffResult.rows[0]?.name || 'Unknown Staff';
    
    // Log this activity in customer_activity
    await pool.query(
      'INSERT INTO customer_activity (user_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4)',
      [
        updatedTicket.user_id,
        'ticket_status_changed',
        `Ticket status changed to ${status} by ${staffName}`,
        JSON.stringify({ 
          ticket_id: ticketId, 
          old_status: updatedTicket.status,
          new_status: status,
          staff_id: staffId
        })
      ]
    );
    
    // If ticket is being closed, check if it has a satisfaction rating
    if (status === 'closed' && !updatedTicket.satisfaction_rating) {
      // TODO: Send email to customer asking for feedback
      console.log(`Ticket ${ticketId} closed without satisfaction rating. Consider requesting feedback.`);
    }
    
    // Return the updated ticket with a clear success message
    res.json({ 
      success: true, 
      message: `Ticket status updated to '${status}' successfully`,
      ticket: updatedTicket 
    });
  } catch (err) {
    console.error('Error updating ticket status:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}; 