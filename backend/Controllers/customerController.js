import pool from '../db.js';

/**
 * Get all customer tags
 */
export const getTags = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customer_tags ORDER BY name');
    res.json({ success: true, tags: result.rows });
  } catch (err) {
    console.error('Error fetching customer tags:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Create a new customer tag
 */
export const createTag = async (req, res) => {
  const { name, color, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, error: 'Tag name is required' });
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO customer_tags (name, color, description) VALUES ($1, $2, $3) RETURNING *',
      [name, color || '#3B82F6', description]
    );
    res.status(201).json({ success: true, tag: result.rows[0] });
  } catch (err) {
    console.error('Error creating customer tag:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Add tags to a user
 */
export const addTagsToUser = async (req, res) => {
  const { userId } = req.params;
  const { tagIds } = req.body;
  
  if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
    return res.status(400).json({ success: false, error: 'Tag IDs array is required' });
  }
  
  try {
    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Add tags (ignoring duplicates)
    const values = tagIds.map(tagId => `(${userId}, ${tagId})`).join(', ');
    await pool.query(`
      INSERT INTO user_tags (user_id, tag_id)
      VALUES ${values}
      ON CONFLICT (user_id, tag_id) DO NOTHING
    `);
    
    // Get all user tags after update
    const result = await pool.query(`
      SELECT ct.* 
      FROM customer_tags ct
      JOIN user_tags ut ON ct.id = ut.tag_id
      WHERE ut.user_id = $1
      ORDER BY ct.name
    `, [userId]);
    
    res.json({ success: true, tags: result.rows });
  } catch (err) {
    console.error('Error adding tags to user:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Remove a tag from a user
 */
export const removeTagFromUser = async (req, res) => {
  const { userId, tagId } = req.params;
  
  try {
    await pool.query(
      'DELETE FROM user_tags WHERE user_id = $1 AND tag_id = $2',
      [userId, tagId]
    );
    
    res.json({ success: true, message: 'Tag removed successfully' });
  } catch (err) {
    console.error('Error removing tag from user:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get user tags
 */
export const getUserTags = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT ct.* 
      FROM customer_tags ct
      JOIN user_tags ut ON ct.id = ut.tag_id
      WHERE ut.user_id = $1
      ORDER BY ct.name
    `, [userId]);
    
    res.json({ success: true, tags: result.rows });
  } catch (err) {
    console.error('Error fetching user tags:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Add a note about a customer
 */
export const addCustomerNote = async (req, res) => {
  const { userId } = req.params;
  const { note } = req.body;
  const staffId = req.user.id;
  
  if (!note) {
    return res.status(400).json({ success: false, error: 'Note content is required' });
  }
  
  try {
    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const result = await pool.query(
      'INSERT INTO customer_notes (user_id, staff_id, note) VALUES ($1, $2, $3) RETURNING *',
      [userId, staffId, note]
    );
    
    // Get staff name
    const staffResult = await pool.query('SELECT name FROM users WHERE id = $1', [staffId]);
    const staffName = staffResult.rows[0]?.name || 'Unknown Staff';
    
    const noteWithStaffName = {
      ...result.rows[0],
      staff_name: staffName
    };
    
    // Log this activity
    await pool.query(
      'INSERT INTO customer_activity (user_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4)',
      [userId, 'note_added', `Staff member added a note`, JSON.stringify({ note_id: result.rows[0].id, staff_id: staffId })]
    );
    
    res.status(201).json({ success: true, note: noteWithStaffName });
  } catch (err) {
    console.error('Error adding customer note:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get customer notes
 */
export const getCustomerNotes = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT cn.*, u.name as staff_name
      FROM customer_notes cn
      LEFT JOIN users u ON cn.staff_id = u.id
      WHERE cn.user_id = $1
      ORDER BY cn.created_at DESC
    `, [userId]);
    
    res.json({ success: true, notes: result.rows });
  } catch (err) {
    console.error('Error fetching customer notes:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get customer activity timeline
 */
export const getCustomerActivity = async (req, res) => {
  const { userId } = req.params;
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  
  try {
    // Get activities
    const result = await pool.query(`
      SELECT * FROM customer_activity
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);
    
    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM customer_activity WHERE user_id = $1',
      [userId]
    );
    
    const totalCount = parseInt(countResult.rows[0].count);
    
    res.json({ 
      success: true, 
      activities: result.rows,
      pagination: {
        total: totalCount,
        offset,
        limit,
        hasMore: offset + limit < totalCount
      }
    });
  } catch (err) {
    console.error('Error fetching customer activity:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Update ticket priority and due date
 */
export const updateTicketPriority = async (req, res) => {
  const { ticketId } = req.params;
  const { priority, dueDate } = req.body;
  
  if (!priority) {
    return res.status(400).json({ success: false, error: 'Priority is required' });
  }
  
  try {
    let query, params;
    
    if (dueDate) {
      query = `
        UPDATE support_tickets 
        SET priority = $1, due_date = $2, updated_at = NOW() 
        WHERE id = $3 
        RETURNING *
      `;
      params = [priority, dueDate, ticketId];
    } else {
      query = `
        UPDATE support_tickets 
        SET priority = $1, updated_at = NOW() 
        WHERE id = $2 
        RETURNING *
      `;
      params = [priority, ticketId];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }
    
    res.json({ success: true, ticket: result.rows[0] });
  } catch (err) {
    console.error('Error updating ticket priority:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Submit customer satisfaction rating
 */
export const submitSatisfactionRating = async (req, res) => {
  const { ticketId } = req.params;
  const { rating, feedback } = req.body;
  
  if (rating === undefined || rating === null) {
    return res.status(400).json({ success: false, error: 'Rating is required' });
  }
  
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
  }
  
  try {
    const result = await pool.query(`
      UPDATE support_tickets 
      SET satisfaction_rating = $1, satisfaction_feedback = $2, updated_at = NOW() 
      WHERE id = $3 
      RETURNING *
    `, [rating, feedback || null, ticketId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }
    
    // Log this activity
    await pool.query(
      'INSERT INTO customer_activity (user_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4)',
      [
        result.rows[0].user_id, 
        'satisfaction_rating', 
        `Customer submitted a satisfaction rating of ${rating}/5`, 
        JSON.stringify({ ticket_id: ticketId, rating, feedback })
      ]
    );
    
    res.json({ success: true, ticket: result.rows[0] });
  } catch (err) {
    console.error('Error submitting satisfaction rating:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
