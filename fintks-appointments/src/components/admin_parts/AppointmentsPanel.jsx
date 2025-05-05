import { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  Divider,
  Alert,
  Snackbar,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  Event as EventIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

function AppointmentsPanel() {
  const theme = useTheme();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [appointmentForm, setAppointmentForm] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    user_id: '',
    service_id: '',
    employee_id: '',
    status: 'pending'
  });

  useEffect(() => {
    fetchAppointments();
    fetchServices();
    fetchEmployees();
    fetchUsers();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      // Fetch appointments
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments`);
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }
      const data = await response.json();
      
      // Ensure we have user data before displaying appointments
      if (users.length === 0) {
        await fetchUsers();
      }
      
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load appointments: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/services`);
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employees`);
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleOpenEditDialog = (appointment) => {
    setSelectedAppointment(appointment);
    setAppointmentForm({
      title: appointment.title,
      description: appointment.description,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      user_id: appointment.user_id,
      service_id: appointment.service_id,
      employee_id: appointment.employee_id,
      status: appointment.status
    });
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  const handleAppointmentChange = (e) => {
    const { name, value } = e.target;
    setAppointmentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateAppointment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${selectedAppointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update appointment');
      }

      setSnackbar({
        open: true,
        message: 'Appointment updated successfully!',
        severity: 'success'
      });

      setOpenEditDialog(false);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update appointment: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!confirm('Are you sure you want to delete this appointment?')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/appointments/${appointmentId}`, {
        method: 'DELETE'
      });

      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        let errorMessage = 'Failed to delete appointment';
        
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } else {
          // Handle non-JSON response
          await response.text(); // consume the response body
          errorMessage = 'Server returned non-JSON response';
        }
        
        throw new Error(errorMessage);
      }

      setSnackbar({
        open: true,
        message: 'Appointment deleted successfully!',
        severity: 'success'
      });

      fetchAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete appointment: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      setLoading(true);
      
      // No need to map UI status values, send them directly to the backend
      // The backend expects 'pending', 'confirmed', or 'cancelled'
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: status
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update appointment status');
      }

      setSnackbar({
        open: true,
        message: `Appointment status updated successfully!`,
        severity: 'success'
      });

      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendAppointmentEmail = async (appointmentId) => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/emails/appointment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ appointment_id: appointmentId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send appointment email');
      }

      setSnackbar({
        open: true,
        message: 'Appointment email sent successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error sending appointment email:', error);
      setSnackbar({
        open: true,
        message: 'Failed to send appointment email: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip size="small" label="Pending" color="warning" />;
      case 'confirmed':
        return <Chip size="small" label="Confirmed" color="success" />;
      case 'cancelled':
        return <Chip size="small" label="Cancelled" color="error" />;
      default:
        return <Chip size="small" label={status} />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getUserName = (userId) => {
    // First check if the appointment has user_name property from the joined query
    const appointment = appointments.find(a => a.user_id === userId);
    if (appointment && appointment.user_name) {
      return appointment.user_name;
    }
    
    // Fallback to the users array if needed
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown';
  };

  const getServiceName = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Unknown';
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.name : 'Unknown';
  };

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          <EventIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Appointments Management
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />} 
          onClick={fetchAppointments}
        >
          Refresh
        </Button>
      </Box>

      <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 0 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && appointments.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">No appointments found</Typography>
            </Box>
          )}

          {!loading && appointments.length > 0 && (
            <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
              {appointments.map((appointment, index) => (
                <Box key={appointment.id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{ 
                      py: 2,
                      px: 3,
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } 
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography 
                            component="span" 
                            variant="subtitle1"
                            sx={{ fontWeight: 600, mr: 1 }}
                          >
                            {appointment.title}
                          </Typography>
                          <Box sx={{ ml: 'auto' }}>
                            {getStatusChip(appointment.status)}
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Grid container spacing={1} sx={{ mt: 0.5 }}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary" component="span">
                              <strong>Client:</strong> {getUserName(appointment.user_id)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary" component="span">
                              <strong>Service:</strong> {getServiceName(appointment.service_id)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary" component="span">
                              <strong>Employee:</strong> {getEmployeeName(appointment.employee_id)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary" component="span">
                              <strong>Time:</strong> {formatDate(appointment.start_time)} - {formatDate(appointment.end_time)}
                            </Typography>
                          </Grid>
                          {appointment.description && (
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary" component="span">
                                <strong>Description:</strong> {appointment.description}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => handleSendAppointmentEmail(appointment.id)} sx={{ mr: 1 }}>
                        <EmailIcon />
                      </IconButton>
                      {appointment.status === 'pending' && (
                        <IconButton edge="end" onClick={() => handleUpdateStatus(appointment.id, 'confirmed')} sx={{ mr: 1 }}>
                          <CheckCircleIcon color="success" />
                        </IconButton>
                      )}
                      {appointment.status !== 'cancelled' && (
                        <IconButton edge="end" onClick={() => handleUpdateStatus(appointment.id, 'cancelled')} sx={{ mr: 1 }}>
                          <CancelIcon color="error" />
                        </IconButton>
                      )}
                      <IconButton edge="end" onClick={() => handleOpenEditDialog(appointment)} sx={{ mr: 1 }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" onClick={() => handleDeleteAppointment(appointment.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < appointments.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </Box>
      </Paper>

      {/* Edit Appointment Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EditIcon sx={{ mr: 1 }} />
            Edit Appointment
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Title"
                fullWidth
                value={appointmentForm.title}
                onChange={handleAppointmentChange}
                margin="normal"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={appointmentForm.description}
                onChange={handleAppointmentChange}
                margin="normal"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="start_time"
                label="Start Time"
                type="datetime-local"
                fullWidth
                value={appointmentForm.start_time ? new Date(appointmentForm.start_time).toISOString().slice(0, 16) : ''}
                onChange={handleAppointmentChange}
                margin="normal"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="end_time"
                label="End Time"
                type="datetime-local"
                fullWidth
                value={appointmentForm.end_time ? new Date(appointmentForm.end_time).toISOString().slice(0, 16) : ''}
                onChange={handleAppointmentChange}
                margin="normal"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth margin="normal" variant="outlined">
                <InputLabel id="user-select-label">Client</InputLabel>
                <Select
                  labelId="user-select-label"
                  name="user_id"
                  value={appointmentForm.user_id}
                  onChange={handleAppointmentChange}
                  label="Client"
                >
                  {users.map(user => (
                    <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth margin="normal" variant="outlined">
                <InputLabel id="service-select-label">Service</InputLabel>
                <Select
                  labelId="service-select-label"
                  name="service_id"
                  value={appointmentForm.service_id}
                  onChange={handleAppointmentChange}
                  label="Service"
                >
                  {services.map(service => (
                    <MenuItem key={service.id} value={service.id}>{service.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth margin="normal" variant="outlined">
                <InputLabel id="employee-select-label">Employee</InputLabel>
                <Select
                  labelId="employee-select-label"
                  name="employee_id"
                  value={appointmentForm.employee_id}
                  onChange={handleAppointmentChange}
                  label="Employee"
                >
                  {employees.map(employee => (
                    <MenuItem key={employee.id} value={employee.id}>{employee.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal" variant="outlined">
                <InputLabel id="status-select-label">Status</InputLabel>
                <Select
                  labelId="status-select-label"
                  name="status"
                  value={appointmentForm.status}
                  onChange={handleAppointmentChange}
                  label="Status"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseEditDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateAppointment} 
            variant="contained" 
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default AppointmentsPanel;