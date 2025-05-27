import pool from '../db.js';

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

// Get tickets (user: own, admin: all)
export const getTickets = async (req, res) => {
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';
  try {
    const result = isAdmin
      ? await pool.query('SELECT * FROM support_tickets ORDER BY created_at DESC')
      : await pool.query('SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json({ success: true, tickets: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get ticket details and messages
export const getTicketDetails = async (req, res) => {
  const ticketId = req.params.id;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';
  try {
    const ticketResult = await pool.query('SELECT * FROM support_tickets WHERE id = $1', [ticketId]);
    const ticket = ticketResult.rows[0];
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
    if (!isAdmin && ticket.user_id !== userId) return res.status(403).json({ success: false, error: 'Forbidden' });
    const messagesResult = await pool.query('SELECT * FROM support_ticket_messages WHERE ticket_id = $1 ORDER BY created_at ASC', [ticketId]);
    res.json({ success: true, ticket, messages: messagesResult.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Add a message to a ticket
export const addMessage = async (req, res) => {
  const ticketId = req.params.id;
  const userId = req.user.id;
  const { message } = req.body;
  try {
    // Check ticket ownership or admin
    const ticketResult = await pool.query('SELECT * FROM support_tickets WHERE id = $1', [ticketId]);
    const ticket = ticketResult.rows[0];
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
    if (ticket.user_id !== userId && req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });
    await pool.query('INSERT INTO support_ticket_messages (ticket_id, sender_id, message) VALUES ($1, $2, $3)', [ticketId, userId, message]);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// (Optional) Update ticket status (admin only)
export const updateTicketStatus = async (req, res) => {
  const ticketId = req.params.id;
  const { status } = req.body;
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });
  try {
    await pool.query('UPDATE support_tickets SET status = $1 WHERE id = $2', [status, ticketId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}; 