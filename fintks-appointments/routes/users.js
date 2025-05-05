import express from 'express';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const router = express.Router();
const db = new Database(process.env.DB_PATH || 'appointments.db');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
};

router.post('/users/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check if email already exists
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password with stronger salt rounds
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user if it matches admin credentials
    const role = (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) ? 'admin' : 'user';

    const stmt = db.prepare(
      'INSERT INTO users (name, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
    );
    const result = stmt.run(name, email, hashedPassword, role);

    // Generate JWT token
    const token = jwt.sign(
      { id: result.lastInsertRowid, email, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      id: result.lastInsertRowid,
      name,
      email,
      role,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'An error occurred during registration' });
  }
});

router.post('/users/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login timestamp
    const updateStmt = db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
    updateStmt.run(user.id);

    // Check if user is an employee and get employee_id
    let employee_id = null;
    if (user.role === 'employee') {
      const employeeStmt = db.prepare('SELECT id FROM employees WHERE user_id = ?');
      const employee = employeeStmt.get(user.id);
      if (employee) {
        employee_id = employee.id;
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      employee_id,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});

// Password reset request
router.post('/users/reset-password-request', async (req, res) => {
  const { email } = req.body;
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    const stmt = db.prepare(
      'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?'
    );
    stmt.run(resetToken, resetExpires.toISOString(), user.id);

    // Here you would typically send an email with the reset token
    // For development, we'll just return the token
    res.json({ message: 'Password reset token generated', resetToken });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'An error occurred during password reset request' });
  }
});

// Reset password with token or old password
router.post('/users/reset-password', async (req, res) => {
  const { token, newPassword, userId, oldPassword } = req.body;
  try {
    if (token) {
      // Handle password reset with token (forgot password flow)
      if (!newPassword) {
        return res.status(400).json({ error: 'New password is required' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }

      const user = db.prepare(
        'SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expires > CURRENT_TIMESTAMP'
      ).get(token);

      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      const stmt = db.prepare(
        'UPDATE users SET password = ?, password_reset_token = NULL, password_reset_expires = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      );
      stmt.run(hashedPassword, user.id);

      res.json({ message: 'Password has been reset successfully' });
    } else if (userId && oldPassword) {
      // Handle password change with old password (change password flow)
      if (!newPassword) {
        return res.status(400).json({ error: 'New password is required' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const validOldPassword = await bcrypt.compare(oldPassword, user.password);
      if (!validOldPassword) {
        return res.status(401).json({ error: 'Invalid old password' });
      }

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      const stmt = db.prepare(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      );
      stmt.run(hashedPassword, userId);

      res.json({ message: 'Password has been changed successfully' });
    } else {
      return res.status(400).json({ error: 'Invalid request' });
    }
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'An error occurred during password reset' });
  }
});

// This duplicate route has been removed

router.put('/users/update-profile', authenticateToken, async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Verify current password
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Update user info
    const stmt = db.prepare(
      'UPDATE users SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    );
    stmt.run(name, email, req.user.id);

    res.json({ 
      message: 'Profile updated successfully',
      user: { id: user.id, name, email }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// User self-delete account
router.delete('/users/account/:id', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.params.id;

    // Verify user exists and is the same as authenticated user
    if (req.user.id != userId) {
      return res.status(403).json({ error: 'You can only delete your own account' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password matches
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Delete user
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Admin routes

// Get all users (admin only)
router.get('/users', authenticateToken, isAdmin, (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT id, name, email, role, 
      appointment_limit, created_at, last_login 
      FROM users
      ORDER BY created_at DESC
    `);
    const users = stmt.all();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user (admin only)
router.put('/users/:id', authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { name, email, role, appointment_limit } = req.body;

  try {
    // Check if user exists
    const userExists = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user
    const stmt = db.prepare(`
      UPDATE users 
      SET name = ?, email = ?, role = ?, appointment_limit = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(name, email, role, appointment_limit, id);

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Admin delete user
router.delete('/users/:id', authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if user exists
    const userExists = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;