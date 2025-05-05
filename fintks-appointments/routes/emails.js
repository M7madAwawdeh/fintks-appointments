import express from 'express';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { initializeTransporter, sendEmail, sendVerificationEmail, sendAppointmentEmail, trackEmailStatus, updateEmailStatus } from '../utils/emailService.js';

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

// Initialize email transporter with configuration from environment variables
initializeTransporter({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  user: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASSWORD
});

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
};

// Get all email notifications (admin only)
router.get('/emails', authenticateToken, isAdmin, (req, res) => {
  try {
    const { type, status, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT en.*, u.name, u.email FROM email_notifications en JOIN users u ON en.user_id = u.id';
    const queryParams = [];
    
    if (type || status) {
      query += ' WHERE';
      if (type) {
        query += ' en.type = ?';
        queryParams.push(type);
      }
      
      if (type && status) {
        query += ' AND';
      }
      
      if (status) {
        query += ' en.status = ?';
        queryParams.push(status);
      }
    }
    
    query += ' ORDER BY en.sent_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);
    
    const stmt = db.prepare(query);
    const emails = stmt.all(...queryParams);
    
    if (!emails || !Array.isArray(emails)) {
      throw new Error('Invalid response format from database');
    }
    
    res.json({
      success: true,
      data: emails
    });
  } catch (error) {
    console.error('Error fetching email notifications:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch email notifications'
    });
  }
});

// Get email notification by ID (admin only)
router.get('/emails/:id', authenticateToken, isAdmin, (req, res) => {
  try {
    const { id } = req.params;
    
    const stmt = db.prepare('SELECT en.*, u.name, u.email FROM email_notifications en JOIN users u ON en.user_id = u.id WHERE en.id = ?');
    const email = stmt.get(id);
    
    if (!email) {
      return res.status(404).json({ error: 'Email notification not found' });
    }
    
    res.json(email);
  } catch (error) {
    console.error('Error fetching email notification:', error);
    res.status(500).json({ error: 'Failed to fetch email notification' });
  }
});

// Send a test email (admin only)
router.post('/emails/test', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;
    
    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get user ID from email
    const userStmt = db.prepare('SELECT id FROM users WHERE email = ?');
    const user = userStmt.get(to);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Track email in database
    const trackStmt = db.prepare(
      'INSERT INTO email_notifications (type, user_id, status, content, sent_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)'
    );
    const trackResult = trackStmt.run('test', user.id, 'pending', html || text);
    
    // Send email
    const emailResult = await sendEmail({
      to,
      subject,
      text,
      html
    });
    
    // Update email status
    const updateStmt = db.prepare(
      'UPDATE email_notifications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    );
    updateStmt.run(emailResult.success ? 'sent' : 'failed', trackResult.lastInsertRowid);
    
    if (emailResult.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: emailResult.messageId,
        emailId: trackResult.lastInsertRowid
      });
    } else {
      res.status(500).json({
        success: false,
        error: emailResult.error,
        emailId: trackResult.lastInsertRowid
      });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

// Send verification email
router.post('/emails/verification', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Get user details
    const userStmt = db.prepare('SELECT id, name, email FROM users WHERE id = ?');
    const user = userStmt.get(user_id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate verification token
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    
    // Save token to database
    const tokenStmt = db.prepare('UPDATE users SET password_reset_token = ?, password_reset_expires = datetime("now", "+1 day") WHERE id = ?');
    tokenStmt.run(token, user_id);
    
    // Create verification URL
    const verificationUrl = `http://localhost:5173/verify-email?token=${token}`;
    
    // Track email in database
    const trackStmt = db.prepare(
      'INSERT INTO email_notifications (type, user_id, status, sent_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
    );
    const trackResult = trackStmt.run('verification', user_id, 'pending');
    
    // Send verification email
    const emailResult = await sendVerificationEmail(user, verificationUrl);
    
    // Update email status
    const updateStmt = db.prepare(
      'UPDATE email_notifications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    );
    updateStmt.run(emailResult.success ? 'sent' : 'failed', trackResult.lastInsertRowid);
    
    if (emailResult.success) {
      res.json({
        success: true,
        message: 'Verification email sent successfully',
        emailId: trackResult.lastInsertRowid
      });
    } else {
      res.status(500).json({
        success: false,
        error: emailResult.error,
        emailId: trackResult.lastInsertRowid
      });
    }
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

// Send appointment email
router.post('/emails/appointment', async (req, res) => {
  try {
    const { appointment_id } = req.body;
    
    if (!appointment_id) {
      return res.status(400).json({ error: 'Appointment ID is required' });
    }
    
    // Get appointment details with user, service, and employee information
    const appointmentStmt = db.prepare(`
      SELECT 
        a.*, 
        u.id as user_id, u.name as user_name, u.email as user_email,
        s.id as service_id, s.name as service_name, s.description as service_description,
        e.id as employee_id, eu.name as employee_name
      FROM appointments a
      JOIN users u ON a.user_id = u.id
      JOIN services s ON a.service_id = s.id
      JOIN employees e ON a.employee_id = e.id
      JOIN users eu ON e.user_id = eu.id
      WHERE a.id = ?
    `);
    
    const appointmentData = appointmentStmt.get(appointment_id);
    
    if (!appointmentData) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Prepare data for email
    const user = {
      id: appointmentData.user_id,
      name: appointmentData.user_name,
      email: appointmentData.user_email
    };
    
    const appointment = {
      id: appointmentData.id,
      title: appointmentData.title,
      description: appointmentData.description,
      start_time: appointmentData.start_time,
      end_time: appointmentData.end_time,
      status: appointmentData.status
    };
    
    const service = {
      id: appointmentData.service_id,
      name: appointmentData.service_name,
      description: appointmentData.service_description
    };
    
    const employee = {
      id: appointmentData.employee_id,
      name: appointmentData.employee_name
    };
    
    // Track email in database
    const trackStmt = db.prepare(
      'INSERT INTO email_notifications (type, user_id, reference_id, status, sent_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)'
    );
    const trackResult = trackStmt.run('appointment', user.id, appointment_id, 'pending');
    
    // Send appointment email
    const emailResult = await sendAppointmentEmail(user, appointment, service, employee);
    
    // Update email status
    const updateStmt = db.prepare(
      'UPDATE email_notifications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    );
    updateStmt.run(emailResult.success ? 'sent' : 'failed', trackResult.lastInsertRowid);
    
    if (emailResult.success) {
      res.json({
        success: true,
        message: 'Appointment email sent successfully',
        emailId: trackResult.lastInsertRowid
      });
    } else {
      res.status(500).json({
        success: false,
        error: emailResult.error,
        emailId: trackResult.lastInsertRowid
      });
    }
  } catch (error) {
    console.error('Error sending appointment email:', error);
    res.status(500).json({ error: 'Failed to send appointment email' });
  }
});

// Update email status (for tracking opens, etc.)
router.put('/emails/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['pending', 'sent', 'delivered', 'failed', 'opened'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const stmt = db.prepare(
      'UPDATE email_notifications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    );
    const result = stmt.run(status, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Email notification not found' });
    }
    
    res.json({
      success: true,
      message: 'Email status updated successfully'
    });
  } catch (error) {
    console.error('Error updating email status:', error);
    res.status(500).json({ error: 'Failed to update email status' });
  }
});

export default router;