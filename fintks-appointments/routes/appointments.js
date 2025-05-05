import express from 'express';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import { sendAppointmentEmail } from '../utils/emailService.js';

const router = express.Router();
const db = new Database('appointments.db');

router.post('/appointments', (req, res) => {
  const { title, description, start_time, end_time, user_id, service_id, employee_id } = req.body;
  try {
    // Check user's appointment limit
    const checkUserLimitStmt = db.prepare(`
      SELECT u.appointment_limit, COUNT(a.id) as current_appointments
      FROM users u
      LEFT JOIN appointments a ON u.id = a.user_id
      WHERE u.id = ? AND (a.status = 'pending' OR a.status = 'confirmed')
      GROUP BY u.id
    `);
    
    const userLimit = checkUserLimitStmt.get(user_id);
    
    if (userLimit && userLimit.appointment_limit > 0 && userLimit.current_appointments >= userLimit.appointment_limit) {
      return res.status(400).json({ error: 'You have reached your appointment limit' });
    }
    // Check if the employee is available at the requested time
    const checkAvailabilityStmt = db.prepare(`
      SELECT ea.* FROM employee_availability ea
      WHERE ea.employee_id = ? AND ea.day_of_week = ?
    `);
    
    const appointmentDate = new Date(start_time);
    const dayOfWeek = appointmentDate.getDay();
    
    const availability = checkAvailabilityStmt.get(employee_id, dayOfWeek);
    
    if (!availability) {
      return res.status(400).json({ error: 'Employee is not available on this day' });
    }
    
    // Check if the time is within the employee's availability hours
    const appointmentStartTime = appointmentDate.getHours() * 60 + appointmentDate.getMinutes();
    const appointmentEndTime = new Date(end_time).getHours() * 60 + new Date(end_time).getMinutes();
    
    const [availStartHours, availStartMinutes] = availability.start_time.split(':').map(Number);
    const [availEndHours, availEndMinutes] = availability.end_time.split(':').map(Number);
    
    const availStartMinutesTotal = availStartHours * 60 + availStartMinutes;
    const availEndMinutesTotal = availEndHours * 60 + availEndMinutes;
    
    if (appointmentStartTime < availStartMinutesTotal || appointmentEndTime > availEndMinutesTotal) {
      return res.status(400).json({ error: 'Appointment time is outside of employee\'s available hours' });
    }
    
    // Check for overlapping appointments
    const checkOverlapStmt = db.prepare(`
      SELECT * FROM appointments 
      WHERE employee_id = ? 
      AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?) OR (start_time >= ? AND end_time <= ?))
    `);
    
    const overlappingAppointment = checkOverlapStmt.get(
      employee_id, 
      end_time, 
      start_time, 
      end_time, 
      start_time, 
      start_time, 
      end_time
    );
    
    if (overlappingAppointment) {
      return res.status(400).json({ error: 'This time slot overlaps with an existing appointment' });
    }
    
    const stmt = db.prepare(
      'INSERT INTO appointments (title, description, start_time, end_time, user_id, service_id, employee_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(title, description, start_time, end_time, user_id, service_id, employee_id);
    
    // Send appointment confirmation email
    try {
      // Get user details
      const userStmt = db.prepare('SELECT id, name, email FROM users WHERE id = ?');
      const user = userStmt.get(user_id);
      
      // Get service details
      const serviceStmt = db.prepare('SELECT id, name, description FROM services WHERE id = ?');
      const service = serviceStmt.get(service_id);
      
      // Get employee details
      const employeeStmt = db.prepare(`
        SELECT e.id, u.name 
        FROM employees e 
        JOIN users u ON e.user_id = u.id 
        WHERE e.id = ?
      `);
      const employee = employeeStmt.get(employee_id);
      
      // Create appointment object
      const appointment = {
        id: result.lastInsertRowid,
        title,
        description,
        start_time,
        end_time,
        status: 'pending'
      };
      
      // Track email in database
      const trackStmt = db.prepare(
        'INSERT INTO email_notifications (type, user_id, reference_id, status, sent_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)'
      );
      const trackResult = trackStmt.run('appointment', user_id, result.lastInsertRowid, 'pending');
      
      // Send appointment email asynchronously
      sendAppointmentEmail(user, appointment, service, employee)
        .then(emailResult => {
          // Update email status
          const updateStmt = db.prepare(
            'UPDATE email_notifications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
          );
          updateStmt.run(emailResult.success ? 'sent' : 'failed', trackResult.lastInsertRowid);
        })
        .catch(error => {
          console.error('Error sending appointment email:', error);
        });
    } catch (error) {
      console.error('Error preparing appointment email:', error);
    }
    
    res.json({ 
      id: result.lastInsertRowid, 
      title, 
      description, 
      start_time, 
      end_time, 
      user_id,
      service_id,
      employee_id 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/appointments', (req, res) => {
  const { user_id, employee_id } = req.query;
  try {
    let query;
    let params = [];
    
    // Base query with joins to get user, service, and employee names
    const baseQuery = `
      SELECT a.*, 
        u.name as user_name, 
        s.name as service_name, 
        eu.name as employee_name
      FROM appointments a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN employees e ON a.employee_id = e.id
      LEFT JOIN users eu ON e.user_id = eu.id
    `;
    
    if (employee_id) {
      // If employee_id is provided, fetch appointments for that employee
      query = baseQuery + ' WHERE a.employee_id = ? ORDER BY a.start_time';
      params.push(employee_id);
    } else if (user_id) {
      // If user_id is provided, fetch appointments for that user
      query = baseQuery + ' WHERE a.user_id = ? ORDER BY a.start_time';
      params.push(user_id);
    } else {
      // If neither is provided, return all appointments (for admin panel)
      query = baseQuery + ' ORDER BY a.start_time DESC';
    }
    
    const stmt = db.prepare(query);
    const appointments = stmt.all(...params);
    
    // Fetch meeting information for confirmed appointments
    const getMeetingStmt = db.prepare('SELECT * FROM meetings WHERE appointment_id = ?');
    
    // Add meeting info to each confirmed appointment
    const appointmentsWithMeetings = appointments.map(appointment => {
      if (appointment.status === 'confirmed') {
        const meetingInfo = getMeetingStmt.get(appointment.id);
        if (meetingInfo) {
          return { ...appointment, meetingInfo };
        }
      }
      return appointment;
    });
    
    res.json(appointmentsWithMeetings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/appointments/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, start_time, end_time, user_id, service_id, employee_id, status } = req.body;
    
    // Check if appointment exists
    const checkStmt = db.prepare('SELECT * FROM appointments WHERE id = ?');
    const existingAppointment = checkStmt.get(id);
    
    if (!existingAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Update appointment
    const stmt = db.prepare(`
      UPDATE appointments 
      SET title = ?, description = ?, start_time = ?, end_time = ?, 
          user_id = ?, service_id = ?, employee_id = ?, status = ? 
      WHERE id = ?
    `);
    
    stmt.run(
      title || existingAppointment.title,
      description || existingAppointment.description,
      start_time || existingAppointment.start_time,
      end_time || existingAppointment.end_time,
      user_id || existingAppointment.user_id,
      service_id || existingAppointment.service_id,
      employee_id || existingAppointment.employee_id,
      status || existingAppointment.status,
      id
    );
    
    // If status has changed, send notification email
    if (status && status !== existingAppointment.status) {
      // Get user details
      const userStmt = db.prepare('SELECT id, name, email FROM users WHERE id = ?');
      const user = userStmt.get(user_id || existingAppointment.user_id);
      
      // Get service details
      const serviceStmt = db.prepare('SELECT id, name, description FROM services WHERE id = ?');
      const service = serviceStmt.get(service_id || existingAppointment.service_id);
      
      // Get employee details
      const employeeStmt = db.prepare(`
        SELECT e.id, u.name 
        FROM employees e 
        JOIN users u ON e.user_id = u.id 
        WHERE e.id = ?
      `);
      const employee = employeeStmt.get(employee_id || existingAppointment.employee_id);
      
      // Create appointment object with updated info
      const updatedAppointmentObj = {
        id: parseInt(id),
        title: title || existingAppointment.title,
        description: description || existingAppointment.description,
        start_time: start_time || existingAppointment.start_time,
        end_time: end_time || existingAppointment.end_time,
        status: status
      };
      
      // Track email in database
      const trackStmt = db.prepare(
        'INSERT INTO email_notifications (type, user_id, reference_id, status, sent_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)'
      );
      const trackResult = trackStmt.run('appointment', user.id, id, 'pending');
      
      // Send appointment email asynchronously
      sendAppointmentEmail(user, updatedAppointmentObj, service, employee)
        .then(emailResult => {
          // Update email status
          const updateStmt = db.prepare(
            'UPDATE email_notifications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
          );
          updateStmt.run(emailResult.success ? 'sent' : 'failed', trackResult.lastInsertRowid);
        })
        .catch(error => {
          console.error('Error sending appointment update email:', error);
        });
    }
    
    // Get updated appointment
    const getStmt = db.prepare(`
      SELECT a.*, s.name as service_name, u.name as user_name, eu.name as employee_name
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN users u ON a.user_id = u.id
      JOIN employees e ON a.employee_id = e.id
      JOIN users eu ON e.user_id = eu.id
      WHERE a.id = ?
    `);
    
    const updatedAppointment = getStmt.get(id);
    
    res.json(updatedAppointment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add the missing status update endpoint
router.put('/appointments/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    // Store cancellation note if provided
    const cancellation_note = req.body.cancellation_note || null;
    
    // Check if appointment exists
    const checkStmt = db.prepare('SELECT * FROM appointments WHERE id = ?');
    const existingAppointment = checkStmt.get(id);
    
    if (!existingAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Update appointment status
    const stmt = db.prepare('UPDATE appointments SET status = ? WHERE id = ?');
    stmt.run(status, id);
    
    // Get user, service, and employee details for email notification
    const userStmt = db.prepare('SELECT id, name, email FROM users WHERE id = ?');
    const user = userStmt.get(existingAppointment.user_id);
    
    const serviceStmt = db.prepare('SELECT id, name, description FROM services WHERE id = ?');
    const service = serviceStmt.get(existingAppointment.service_id);
    
    const employeeStmt = db.prepare(`
      SELECT e.id, u.name, u.email 
      FROM employees e 
      JOIN users u ON e.user_id = u.id 
      WHERE e.id = ?
    `);
    const employee = employeeStmt.get(existingAppointment.employee_id);
    
    // Create appointment object with updated status and cancellation note if applicable
    const updatedAppointment = {
      ...existingAppointment,
      status: status,
      cancellation_note: cancellation_note
    };
    
    // If status is confirmed, create a meeting
    let meetingInfo = null;
    if (status === 'confirmed') {
      // Generate a random meeting password (6 characters)
      const meetingPassword = crypto.randomBytes(3).toString('hex').toUpperCase();
      
      // Create a meeting link using Jitsi Meet
      const roomName = `appointment-${id}-${crypto.randomBytes(4).toString('hex')}`;
      const meetingLink = `https://meet.jit.si/${roomName}`;
      
      // Check if a meeting already exists for this appointment
      const checkMeetingStmt = db.prepare('SELECT * FROM meetings WHERE appointment_id = ?');
      const existingMeeting = checkMeetingStmt.get(id);
      
      if (existingMeeting) {
        // Update existing meeting
        const updateMeetingStmt = db.prepare(
          'UPDATE meetings SET meeting_link = ?, password = ? WHERE appointment_id = ?'
        );
        updateMeetingStmt.run(meetingLink, meetingPassword, id);
      } else {
        // Create new meeting
        const createMeetingStmt = db.prepare(
          'INSERT INTO meetings (appointment_id, meeting_link, password) VALUES (?, ?, ?)'
        );
        createMeetingStmt.run(id, meetingLink, meetingPassword);
      }
      
      // Get the meeting info to include in the response
      const getMeetingStmt = db.prepare('SELECT * FROM meetings WHERE appointment_id = ?');
      meetingInfo = getMeetingStmt.get(id);
      
      // Add meeting info to the appointment object for email
      updatedAppointment.meetingInfo = meetingInfo;
    }
    
    // Track email in database
    const trackStmt = db.prepare(
      'INSERT INTO email_notifications (type, user_id, reference_id, status, sent_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)'
    );
    const trackResult = trackStmt.run('appointment', user.id, id, 'pending');
    
    // Send appointment status update email asynchronously
    sendAppointmentEmail(user, updatedAppointment, service, employee)
      .then(emailResult => {
        // Update email status
        const updateStmt = db.prepare(
          'UPDATE email_notifications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        );
        updateStmt.run(emailResult.success ? 'sent' : 'failed', trackResult.lastInsertRowid);
      })
      .catch(error => {
        console.error('Error sending appointment status update email:', error);
      });
    
    // If status is confirmed, also send email to employee
    if (status === 'confirmed' && employee.email) {
      const employeeTrackStmt = db.prepare(
        'INSERT INTO email_notifications (type, user_id, reference_id, status, sent_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)'
      );
      const employeeTrackResult = employeeTrackStmt.run('appointment', employee.id, id, 'pending');
      
      // Send appointment email to employee
      sendAppointmentEmail(employee, updatedAppointment, service, { name: user.name })
        .then(emailResult => {
          // Update email status
          const updateStmt = db.prepare(
            'UPDATE email_notifications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
          );
          updateStmt.run(emailResult.success ? 'sent' : 'failed', employeeTrackResult.lastInsertRowid);
        })
        .catch(error => {
          console.error('Error sending appointment email to employee:', error);
        });
    }
    
    // Get updated appointment with joined data
    const getStmt = db.prepare(`
      SELECT a.*, s.name as service_name, u.name as user_name, eu.name as employee_name
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN users u ON a.user_id = u.id
      JOIN employees e ON a.employee_id = e.id
      JOIN users eu ON e.user_id = eu.id
      WHERE a.id = ?
    `);
    
    const appointmentWithDetails = getStmt.get(id);
    
    // Add meeting info to the response if status is confirmed
    if (status === 'confirmed' && meetingInfo) {
      appointmentWithDetails.meetingInfo = meetingInfo;
    }
    
    res.json(appointmentWithDetails);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/appointments/:id', (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('DELETE FROM appointments WHERE id = ?');
    stmt.run(id);
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;