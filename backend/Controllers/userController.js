import pool from '../db.js';
import AppError from '../utils/AppError.js';
import path from 'path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

// Configure Nodemailer transporter for Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});


// Get all users with pagination
export const getAllUsers = async (req, res, next) => {
  const { page = 1, limit = 10, role, search } = req.query;
  const offset = (page - 1) * limit;
  let query = 'SELECT id, name, email, role, points, created_at FROM users';
  const params = [];

  if (role) {
    query += ' WHERE role = $1';
    params.push(role);
  }

  if (search) {
    query += role ? ' AND' : ' WHERE';
    query += ' (name ILIKE $' + (params.length + 1) + ' OR email ILIKE $' + (params.length + 1) + ')';
    params.push(`%${search}%`);
  }

  query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
  params.push(limit, offset);

  try {
    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

// Create new user
export const createUser = async (req, res, next) => {
  const { name, email, phone, password, role = 'user' } = req.body;

  try {
    // Validate input
    if (!name || !email || !password) {
      return next(new AppError('Name, email, and password are required', 400));
    }

    // Check if email or phone already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1 OR phone = $2', [email, phone]);
    if (existingUser.rows.length > 0) {
      return next(new AppError('Email or phone already in use', 400));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (name, email, phone, password, role, points, is_verified) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, email, phone, hashedPassword, role, 0, false]
    );

    // OTP generation (6 digit)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    await pool.query(
      'INSERT INTO otps (user_id, email, phone, otp_code, expires_at) VALUES ($1, $2, $3, $4, $5)',
      [result.rows[0].id, email, phone, otpCode, expiresAt]
    );

    // Send OTP via email
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otpCode}`
    });

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'OTP sent to email address.'
    });
  } catch (error) {
    console.error('Error in createUser:', error);
    next(new AppError(error.message || 'Error creating user', 500));
  }
};

// Verify OTP for email
export const verifyOtp = async (req, res, next) => {
  const { email, otp_code } = req.body;
  try {
    if (!email || !otp_code) {
      return next(new AppError('Email and OTP code are required', 400));
    }
    // Find latest unverified OTP for this email
    const otpResult = await pool.query(
      'SELECT * FROM otps WHERE email = $1 AND verified = FALSE ORDER BY created_at DESC LIMIT 1',
      [email]
    );
    if (otpResult.rows.length === 0) {
      return next(new AppError('OTP not found or already verified', 400));
    }
    const otp = otpResult.rows[0];
    if (otp.otp_code !== otp_code) {
      return next(new AppError('Invalid OTP code', 400));
    }
    if (new Date() > new Date(otp.expires_at)) {
      return next(new AppError('OTP has expired', 400));
    }
    // Mark OTP as verified
    await pool.query('UPDATE otps SET verified = TRUE WHERE id = $1', [otp.id]);
    // Mark user as verified
    await pool.query('UPDATE users SET is_verified = TRUE WHERE email = $1', [email]);
    res.json({ success: true, message: 'OTP verified successfully.' });
  } catch (error) {
    next(new AppError('Error verifying OTP', 500));
  }
};

// User login (add this function)
export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return next(new AppError('User not found', 401));
    }
    const user = result.rows[0];
    console.log('User found for login:', user); // Debugging
    // Only require OTP verification for users with role 'user'
    if (user.role === 'user' && !user.is_verified) {
      return next(new AppError('Account not verified. Please check your email for the OTP.', 401));
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', passwordMatch); // Debugging
    if (!passwordMatch) {
      return next(new AppError('Invalid email or password', 401));
    }
    // Remove password from response
    delete user.password;
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.json({ success: true, token, data: user });
  } catch (error) {
    console.error('Error in loginUser:', error);
    next(new AppError(error.message || 'Error logging in', 500));
  }
};

// Update user
export const updateUser = async (req, res, next) => {
  const { id } = req.params;
  const { name, email, role, points, phone } = req.body;

  try {
    // Check if user exists
    const userExists = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userExists.rows.length === 0) {
      return next(new AppError('User not found', 404));
    }

    // Update user
    const result = await pool.query(
      'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), role = COALESCE($3, role), points = COALESCE($4, points), phone = COALESCE($5, phone) WHERE id = $6 RETURNING id, name, email, role, points, phone',
      [name, email, role, points, phone, id]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(new AppError('Error updating user', 500));
  }
};

// Delete user
export const deleteUser = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Check if user exists
    const userExists = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userExists.rows.length === 0) {
      return next(new AppError('User not found', 404));
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    
    res.status(204).send();
  } catch (error) {
    next(new AppError('Error deleting user', 500));
  }
};

// Get user by ID
export const getUserById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT id, name, email, role, points, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return next(new AppError('User not found', 404));
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(new AppError('Error fetching user', 500));
  }
};

// Upload profile image
export const uploadProfileImage = async (req, res, next) => {
  const { id } = req.params;
  if (!req.file) {
    return next(new AppError('No file uploaded', 400));
  }
  try {
    // Update user profile_image in DB
    const imagePath = `/uploads/${req.file.filename}`;
    const result = await pool.query(
      'UPDATE users SET profile_image = $1 WHERE id = $2 RETURNING id, name, email, role, points, profile_image',
      [imagePath, id]
    );
    if (result.rows.length === 0) {
      return next(new AppError('User not found', 404));
    }
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Upload error:', error);
    next(new AppError('Error uploading profile image', 500));
  }
};

// Get user profile (with image URL)
export const getUserProfile = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, points, profile_image, loyalty_tier, referral_code, referred_by FROM users WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return next(new AppError('User not found', 404));
    }
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(new AppError('Error fetching user profile', 500));
  }
};

// Owner business stats
export const getOwnerStats = async (req, res, next) => {
  try {
    // Total active users
    const usersResult = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['user']);
    const totalUsers = parseInt(usersResult.rows[0].count);

    // Top redeemed rewards
    const topRewardsResult = await pool.query(`
      SELECT r.id, r.title, COUNT(t.id) as redeemed_count
      FROM rewards r
      JOIN transactions t ON t.reward_id = r.id AND t.type = 'reward_redeemed'
      GROUP BY r.id, r.title
      ORDER BY redeemed_count DESC
      LIMIT 5
    `);

    // Total redemptions
    const totalRedemptionsResult = await pool.query(
      `SELECT COUNT(*) FROM transactions WHERE type = 'reward_redeemed'`
    );
    const totalRedemptions = parseInt(totalRedemptionsResult.rows[0].count);

    // Recent admin & cashier activity logs (last 10)
    const activityLogsResult = await pool.query(`
      SELECT t.id, t.user_id, u.name as user_name, u.role, t.type, t.amount, t.description, t.created_at
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE u.role IN ('admin', 'cashier')
      ORDER BY t.created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        totalUsers,
        topRewards: topRewardsResult.rows,
        totalRedemptions,
        activityLogs: activityLogsResult.rows
      }
    });
  } catch (error) {
    next(new AppError('Error fetching owner stats', 500));
  }
};

// Get all users with their total purchase and points (for owner)
export const getOwnerUsersStats = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.points, COALESCE(SUM(CASE WHEN t.type = 'points_added' AND t.purchase_amount IS NOT NULL THEN t.purchase_amount ELSE 0 END), 0) as total_purchase
      FROM users u
      LEFT JOIN transactions t ON u.id = t.user_id
      WHERE u.role = 'user'
      GROUP BY u.id, u.name, u.email, u.points
      ORDER BY total_purchase DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(new AppError('Error fetching user stats', 500));
  }
};

// Owner metrics for dashboard charts
export const getOwnerMetrics = async (req, res, next) => {
  try {
    // User growth per month (last 12 months)
    const userGrowthResult = await pool.query(`
      SELECT to_char(created_at, 'YYYY-MM') as month,
             COUNT(*) as new_users
      FROM users
      WHERE role = 'user'
        AND created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '11 months'
      GROUP BY month
      ORDER BY month
    `);
    // Get cumulative total users per month
    const totalUsersResult = await pool.query(`
      SELECT to_char(months.month, 'YYYY-MM') as month,
             COUNT(u.id) as total_users
      FROM (
        SELECT generate_series(
          date_trunc('month', CURRENT_DATE) - INTERVAL '11 months',
          date_trunc('month', CURRENT_DATE),
          interval '1 month'
        ) as month
      ) months
      LEFT JOIN users u ON u.role = 'user' AND u.created_at <= months.month + interval '1 month' - interval '1 day'
      GROUP BY months.month
      ORDER BY months.month
    `);
    // Points issued/redeemed per month (last 12 months)
    const pointsStatsResult = await pool.query(`
      SELECT to_char(created_at, 'YYYY-MM') as month,
        SUM(CASE WHEN type = 'points_added' THEN amount ELSE 0 END) as points_issued,
        SUM(CASE WHEN type = 'reward_redeemed' THEN ABS(amount) ELSE 0 END) as points_redeemed
      FROM transactions
      WHERE created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '11 months'
      GROUP BY month
      ORDER BY month
    `);
    // Top 5 users by total purchase
    const topUsersResult = await pool.query(`
      SELECT u.id, u.name, u.email, u.points,
             COALESCE(SUM(t.purchase_amount), 0) as total_purchase
      FROM users u
      LEFT JOIN transactions t ON u.id = t.user_id AND t.purchase_amount IS NOT NULL
      WHERE u.role = 'user'
      GROUP BY u.id, u.name, u.email, u.points
      ORDER BY total_purchase DESC
      LIMIT 5
    `);
    res.json({
      success: true,
      data: {
        userGrowth: userGrowthResult.rows,
        totalUsers: totalUsersResult.rows,
        pointsStats: pointsStatsResult.rows,
        topUsers: topUsersResult.rows
      }
    });
  } catch (error) {
    console.error('getOwnerMetrics error:', error);
    next(new AppError('Error fetching owner metrics', 500));
  }
};

// Get user by phone number or name
export const getUserByPhone = async (req, res, next) => {
  const { phone, name } = req.query;
  
  if (!phone && !name) {
    return next(new AppError('Phone number or name is required', 400));
  }
  
  try {
    let query = 'SELECT id, name, phone, points FROM users';
    const params = [];
    
    if (phone && name) {
      // Search by both phone and name
      query += ' WHERE phone = $1 OR name ILIKE $2';
      params.push(phone, `%${name}%`);
    } else if (phone) {
      // Search by phone only
      query += ' WHERE phone = $1';
      params.push(phone);
    } else {
      // Search by name only
      query += ' WHERE name ILIKE $1';
      params.push(`%${name}%`);
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return next(new AppError('User not found', 404));
    }
    
    // If multiple users found (e.g., when searching by name), return the first one
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    next(new AppError('Error fetching user', 500));
  }
};