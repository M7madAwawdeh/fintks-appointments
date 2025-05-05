import express from 'express';
import Database from 'better-sqlite3';

const router = express.Router();
const db = new Database('appointments.db');

// Get all services
router.get('/services', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM services ORDER BY name');
    const services = stmt.all();
    res.json(services);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create a new service
router.post('/services', (req, res) => {
  const { name, description, duration, price } = req.body;
  try {
    const stmt = db.prepare(
      'INSERT INTO services (name, description, duration, price) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(name, description, duration, price);
    res.json({ id: result.lastInsertRowid, name, description, duration, price });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a service
router.put('/services/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, duration, price } = req.body;
  try {
    const stmt = db.prepare(
      'UPDATE services SET name = ?, description = ?, duration = ?, price = ? WHERE id = ?'
    );
    stmt.run(name, description, duration, price, id);
    res.json({ id, name, description, duration, price });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a service
router.delete('/services/:id', (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('DELETE FROM services WHERE id = ?');
    stmt.run(id);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;