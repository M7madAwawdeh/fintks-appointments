import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a transporter object using SMTP transport
let transporter = null;

/**
 * Initialize the email transporter with configuration
 * @param {Object} config - Email configuration object
 */
export const initializeTransporter = (config) => {
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password
    }
  });
};

/**
 * Send an email
 * @param {Object} emailData - Email data including to, subject, text, html
 * @returns {Promise} - Promise with the result of sending the email
 */
export const sendEmail = async (emailData) => {
  if (!transporter) {
    throw new Error('Email transporter not initialized');
  }

  try {
    const mailOptions = {
      from: emailData.from || process.env.EMAIL_FROM,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html
    };

    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send a verification email
 * @param {Object} user - User object with email and verification token
 * @param {string} verificationUrl - URL for email verification
 * @returns {Promise} - Promise with the result of sending the email
 */
export const sendVerificationEmail = async (user, verificationUrl) => {
  const emailData = {
    to: user.email,
    subject: 'Verify Your Email Address',
    text: `Hello ${user.name},\n\nPlease verify your email address by clicking the following link:\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nThank you,\nThe Fintks Appointments Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4a4a4a;">Verify Your Email Address</h2>
        <p>Hello ${user.name},</p>
        <p>Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Verify Email</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>Thank you,<br>The Fintks Appointments Team</p>
      </div>
    `
  };

  return await sendEmail(emailData);
};

/**
 * Send an appointment confirmation email
 * @param {Object} user - User object
 * @param {Object} appointment - Appointment details
 * @param {Object} service - Service details
 * @param {Object} employee - Employee details
 * @returns {Promise} - Promise with the result of sending the email
 */
export const sendAppointmentEmail = async (user, appointment, service, employee) => {
  const startTime = new Date(appointment.start_time);
  const endTime = new Date(appointment.end_time);
  
  const formattedStartTime = startTime.toLocaleString();
  const formattedEndTime = endTime.toLocaleString();
  
  // Customize email content based on appointment status
  let subject = 'Your Appointment Confirmation';
  let statusMessage = 'Your appointment has been scheduled.';
  let statusColor = '#4a4a4a';
  
  if (appointment.status === 'confirmed') {
    subject = 'Your Appointment is Confirmed';
    statusMessage = 'Your appointment has been confirmed.';
    statusColor = '#4CAF50'; // Green color for confirmed
  } else if (appointment.status === 'cancelled') {
    subject = 'Your Appointment is Cancelled';
    statusMessage = 'Your appointment has been cancelled.';
    statusColor = '#F44336'; // Red color for cancelled
  } else if (appointment.status === 'completed') {
    subject = 'Your Appointment is Completed';
    statusMessage = 'Your appointment has been marked as completed.';
    statusColor = '#9C27B0'; // Purple color for completed
  }
  
  // Check if there's meeting info for confirmed appointments or cancellation note for cancelled appointments
  let meetingSection = '';
  let meetingTextSection = '';
  let cancellationSection = '';
  let cancellationTextSection = '';
  
  if (appointment.status === 'confirmed' && appointment.meetingInfo) {
    const { meeting_link, password } = appointment.meetingInfo;
    
    meetingTextSection = `\n\nVideo Meeting Details:\nLink: ${meeting_link}\nPassword: ${password}\n\nYou can join the meeting by clicking the link above and entering the password when prompted.`;
    
    meetingSection = `
      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #4CAF50;">
        <h3 style="margin-top: 0; color: #2e7d32;">Video Meeting Details</h3>
        <p><strong>Meeting Link:</strong> <a href="${meeting_link}" style="color: #2e7d32; text-decoration: none; font-weight: bold;">${meeting_link}</a></p>
        <p><strong>Password:</strong> <span style="font-family: monospace; background-color: #f1f1f1; padding: 3px 6px; border-radius: 3px;">${password}</span></p>
        <p style="margin-bottom: 0;">You can join the meeting by clicking the link above and entering the password when prompted.</p>
      </div>
    `;
  }
  
  // Add cancellation note if available
  if (appointment.status === 'cancelled' && appointment.cancellation_note) {
    cancellationTextSection = `\n\nCancellation Reason: ${appointment.cancellation_note}`;
    
    cancellationSection = `
      <div style="background-color: #ffebee; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #F44336;">
        <h3 style="margin-top: 0; color: #c62828;">Cancellation Reason</h3>
        <p>${appointment.cancellation_note}</p>
      </div>
    `;
  }
  
  const emailData = {
    to: user.email,
    subject: subject,
    text: `Hello ${user.name},\n\n${statusMessage}\n\nDetails:\nService: ${service.name}\nEmployee: ${employee.name}\nDate: ${formattedStartTime} - ${formattedEndTime}\nDescription: ${appointment.description}${meetingTextSection}${cancellationTextSection}\n\nThank you,\nThe Fintks Appointments Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: ${statusColor};">Your Appointment Status</h2>
        <p>Hello ${user.name},</p>
        <p>${statusMessage}</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #4a4a4a;">Appointment Details</h3>
          <p><strong>Service:</strong> ${service.name}</p>
          <p><strong>Employee:</strong> ${employee.name}</p>
          <p><strong>Date:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
          <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${appointment.status}</span></p>
          <p><strong>Description:</strong> ${appointment.description}</p>
        </div>
        ${meetingSection}
        ${cancellationSection}
        <p>Thank you,<br>The Fintks Appointments Team</p>
      </div>
    `
  };


  return await sendEmail(emailData);
};

/**
 * Track email status in the database
 * @param {Object} db - Database connection
 * @param {Object} emailData - Email data including type, user_id, reference_id, status
 * @returns {Promise} - Promise with the result of tracking the email
 */
export const trackEmailStatus = async (db, emailData) => {
  try {
    const stmt = db.prepare(
      'INSERT INTO email_notifications (type, user_id, reference_id, status, sent_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)'
    );
    const result = stmt.run(emailData.type, emailData.user_id, emailData.reference_id, emailData.status);
    return {
      success: true,
      id: result.lastInsertRowid
    };
  } catch (error) {
    console.error('Error tracking email status:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Update email status in the database
 * @param {Object} db - Database connection
 * @param {number} id - Email notification ID
 * @param {string} status - New status
 * @returns {Promise} - Promise with the result of updating the email status
 */
export const updateEmailStatus = async (db, id, status) => {
  try {
    const stmt = db.prepare(
      'UPDATE email_notifications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    );
    const result = stmt.run(status, id);
    return {
      success: true,
      changes: result.changes
    };
  } catch (error) {
    console.error('Error updating email status:', error);
    return {
      success: false,
      error: error.message
    };
  }
};