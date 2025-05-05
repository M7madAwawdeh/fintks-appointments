import { useState,useEffect } from 'react';
import {
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

function ServicePanel() {
  const [services, setServices] = useState([]);
  const [openServiceDialog, setOpenServiceDialog] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    duration: '',
    price: '',
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/services`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = selectedService
        ? `${import.meta.env.VITE_API_URL}/api/services/${selectedService.id}`
        : `${import.meta.env.VITE_API_URL}/api/services`;

      const response = await fetch(url, {
        method: selectedService ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceForm),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      fetchServices();
      setOpenServiceDialog(false);
      setSelectedService(null);
      setServiceForm({ name: '', description: '', duration: '', price: '' });
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const handleEditService = (service) => {
    setSelectedService(service);
    setServiceForm({
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
    });
    setOpenServiceDialog(true);
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Services Management
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setOpenServiceDialog(true)}
        sx={{ mb: 2 }}
      >
        Add New Service
      </Button>

      <List>
        {services.map((service) => (
          <ListItem key={service.id}>
            <ListItemText
              primary={service.name}
              secondary={
                <>Duration: {service.duration} min | Price: ${service.price}</>
              }
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                aria-label="edit"
                onClick={() => handleEditService(service)}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => handleDeleteService(service.id)}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Dialog open={openServiceDialog} onClose={() => setOpenServiceDialog(false)}>
        <DialogTitle>
          {selectedService ? 'Edit Service' : 'Add New Service'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Service Name"
            type="text"
            fullWidth
            value={serviceForm.name}
            onChange={(e) =>
              setServiceForm({ ...serviceForm, name: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={serviceForm.description}
            onChange={(e) =>
              setServiceForm({ ...serviceForm, description: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Duration (minutes)"
            type="number"
            fullWidth
            value={serviceForm.duration}
            onChange={(e) =>
              setServiceForm({ ...serviceForm, duration: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Price"
            type="number"
            fullWidth
            value={serviceForm.price}
            onChange={(e) =>
              setServiceForm({ ...serviceForm, price: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenServiceDialog(false)}>Cancel</Button>
          <Button onClick={handleServiceSubmit} color="primary">
            {selectedService ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default ServicePanel;