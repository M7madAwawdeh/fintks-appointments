import express from 'express';
import Database from 'better-sqlite3';

const router = express.Router();
const db = new Database('appointments.db');

// Get all employees
router.get('/employees', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT e.*, u.name, u.email 
      FROM employees e 
      JOIN users u ON e.user_id = u.id
    `);
    const employees = stmt.all();
    res.json(employees);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create a new employee
router.post('/employees', (req, res) => {
  const { user_id, specialization } = req.body;
  try {
    const stmt = db.prepare(
      'INSERT INTO employees (user_id, specialization) VALUES (?, ?)'
    );
    const result = stmt.run(user_id, specialization);
    res.json({ id: result.lastInsertRowid, user_id, specialization });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update an employee
router.put('/employees/:id', (req, res) => {
  const { id } = req.params;
  const { specialization } = req.body;
  try {
    const stmt = db.prepare(
      'UPDATE employees SET specialization = ? WHERE id = ?'
    );
    stmt.run(specialization, id);
    res.json({ id, specialization });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get employee availability
router.get('/employees/:id/availability', (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('SELECT * FROM employee_availability WHERE employee_id = ?');
    const availability = stmt.all(id);
    res.json(availability);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Set employee availability
router.post('/employees/:id/availability', (req, res) => {
  const { id } = req.params;
  const { day_of_week, start_time, end_time } = req.body;
  try {
    const stmt = db.prepare(
      'INSERT INTO employee_availability (employee_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(id, day_of_week, start_time, end_time);
    res.json({
      id: result.lastInsertRowid,
      employee_id: id,
      day_of_week,
      start_time,
      end_time,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update employee availability
router.put('/employees/:employeeId/availability/:availabilityId', (req, res) => {
  const { employeeId, availabilityId } = req.params;
  const { day_of_week, start_time, end_time } = req.body;
  try {
    const stmt = db.prepare(
      'UPDATE employee_availability SET day_of_week = ?, start_time = ?, end_time = ? WHERE id = ? AND employee_id = ?'
    );
    stmt.run(day_of_week, start_time, end_time, availabilityId, employeeId);
    res.json({ id: availabilityId, employee_id: employeeId, day_of_week, start_time, end_time });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete employee availability
router.delete('/employees/:employeeId/availability/:availabilityId', (req, res) => {
  const { employeeId, availabilityId } = req.params;
  try {
    const stmt = db.prepare('DELETE FROM employee_availability WHERE id = ? AND employee_id = ?');
    stmt.run(availabilityId, employeeId);
    res.json({ message: 'Availability deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete an employee
router.delete('/employees/:id', (req, res) => {
  const { id } = req.params;
  try {
    // First delete all availability records for this employee
    const deleteAvailabilityStmt = db.prepare('DELETE FROM employee_availability WHERE employee_id = ?');
    deleteAvailabilityStmt.run(id);
    
    // Then delete the employee record
    const deleteEmployeeStmt = db.prepare('DELETE FROM employees WHERE id = ?');
    deleteEmployeeStmt.run(id);
    
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;