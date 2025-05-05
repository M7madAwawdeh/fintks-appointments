import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  CircularProgress,
  Fade,
  Snackbar,
  Alert,
  Backdrop,
  useMediaQuery
} from '@mui/material';
import { 
  Add as AddIcon,
  Event as EventIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '@mui/material/styles';

// Import utility and API functions
import { generateTimeSlots, getAvailableDates } from './appointments_parts/appointmentUtils';
import {
  fetchServices,
  fetchEmployees,
  fetchAppointments,
  fetchEmployeeAvailability,
  saveAppointment,
  deleteAppointment
} from './appointments_parts/appointmentsApi';

// Import components
import AppointmentList from './appointments_parts/AppointmentList';
import AppointmentForm from './appointments_parts/AppointmentForm';

function Appointments() {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State for data
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  // UI state
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    service_id: '',
    employee_id: '',
    start_time: null,
    end_time: null,
  });
  const [formErrors, setFormErrors] = useState({});
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);

  // Fetch initial data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        const [fetchedServices, fetchedEmployees] = await Promise.all([
          fetchServices(),
          fetchEmployees()
        ]);
        
        setServices(fetchedServices);
        setEmployees(fetchedEmployees);
        
        if (user) {
          const userAppointments = await fetchAppointments(user.id);
          setAppointments(userAppointments);
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load data. Please try again later.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
  }, [user]);

  // Handle employee availability when employee or service changes
  const handleEmployeeChange = async (employeeId) => {
    // Set the employee ID in the form data
    setFormData(prev => ({
      ...prev,
      employee_id: employeeId,
      start_time: null
    }));
    
    // Fetch the employee's availability
    const availabilityMap = await fetchEmployeeAvailability(employeeId);
    
    // Update employees with availability data
    setEmployees(prevEmployees => {
      return prevEmployees.map(emp => {
        if (emp.id === employeeId) {
          return {
            ...emp,
            availability: Array.from({ length: 7 }, (_, index) => {
              const dayKey = index.toString();
              return availabilityMap[dayKey] || {
                day_of_week: index,
                enabled: false,
                start_time: null,
                end_time: null
              };
            })
          };
        }
        return emp;
      });
    });
    
    // Reset time slots when employee changes
    setAvailableTimeSlots([]);
  };

  // Handle service change to update duration
  const handleServiceChange = (serviceId) => {
    const service = services.find((s) => s.id === serviceId);
    setFormData({
      ...formData,
      service_id: serviceId,
      end_time: formData.start_time
        ? new Date(formData.start_time.getTime() + service.duration * 60000)
        : null
    });
  };

  // Update time slots based on employee, service, and selected date
  useEffect(() => {
    if (formData.employee_id && formData.service_id && formData.start_time) {
      const employee = employees.find((e) => e.id === formData.employee_id);
      const service = services.find((s) => s.id === formData.service_id);
      
      const fetchSlots = async () => {
        const slots = await generateTimeSlots(employee, service, new Date(formData.start_time));
        setAvailableTimeSlots(Array.isArray(slots) ? slots : []);
      };
      fetchSlots();
    }
  }, [formData.employee_id, formData.service_id, formData.start_time, employees, services]);

  // Validate form before submission
  const validateForm = () => {
    const errors = {};
    if (!formData.service_id) errors.service_id = 'Please select a service';
    if (!formData.employee_id) errors.employee_id = 'Please select an employee';
    if (!formData.start_time) errors.start_time = 'Please select a date and time';
    if (!formData.title.trim()) errors.title = 'Please enter a title';
    return errors;
  };

  // Handle dialog open
  const handleOpenDialog = async (appointment = null) => {
    if (appointment) {
      setSelectedAppointment(appointment);
      
      // If editing an existing appointment, fetch the employee's availability
      if (appointment.employee_id) {
        await handleEmployeeChange(appointment.employee_id);
      }
      
      setFormData({
        title: appointment.title,
        description: appointment.description,
        service_id: appointment.service_id,
        employee_id: appointment.employee_id,
        start_time: new Date(appointment.start_time),
        end_time: new Date(appointment.end_time),
      });
    } else {
      setSelectedAppointment(null);
      setFormData({
        title: '',
        description: '',
        service_id: '',
        employee_id: '',
        start_time: null,
        end_time: null,
      });
    }
    setOpenDialog(true);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAppointment(null);
    setFormData({
      title: '',
      description: '',
      start_time: null,
      end_time: null,
    });
    setFormErrors({});
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      // Display validation errors
      setFormErrors(errors);
      return;
    }

    setLoadingAction(true);
    try {
      // Save the appointment
      const savedAppointment = await saveAppointment(
        user, 
        formData, 
        services, 
        selectedAppointment
      );

      // Refresh the appointments list
      const updatedAppointments = await fetchAppointments(user.id);
      setAppointments(updatedAppointments);
      
      // Reset form and close dialog
      handleCloseDialog();
      
      // Show success message
      setSnackbar({
        open: true,
        message: selectedAppointment 
          ? 'Appointment updated successfully!' 
          : 'Appointment created successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving appointment:', error);
      setSnackbar({
        open: true,
        message: `Error: ${error.message || 'Failed to save appointment'}`,
        severity: 'error'
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle appointment deletion
  const handleDelete = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;

    setLoadingAction(true);
    try {
      await deleteAppointment(appointmentId);

      if (user) {
        const updatedAppointments = await fetchAppointments(user.id);
        setAppointments(updatedAppointments);
        
        setSnackbar({
          open: true,
          message: 'Appointment deleted successfully!',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      setSnackbar({
        open: true,
        message: `Error: ${error.message || 'Failed to delete appointment'}`,
        severity: 'error'
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Fade in={true} timeout={800}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: { xs: 2, sm: 4 },
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* Loading overlay */}
            {loading && (
              <Backdrop
                sx={{ 
                  position: 'absolute',
                  zIndex: 1,
                  color: '#fff',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)'
                }}
                open={true}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <CircularProgress color="primary" />
                  <Typography variant="body2" sx={{ mt: 2, color: 'text.primary' }}>
                    Loading appointments...
                  </Typography>
                </Box>
              </Backdrop>
            )}
            
            {/* Header */}
            <Box 
              display="flex" 
              flexDirection={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between" 
              alignItems={{ xs: 'flex-start', sm: 'center' }} 
              mb={4}
              gap={2}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarIcon 
                  sx={{ 
                    fontSize: 36, 
                    mr: 2, 
                    color: 'primary.main',
                    display: { xs: 'none', sm: 'block' }
                  }} 
                />
                <Typography 
                  variant="h4" 
                  component="h1" 
                  sx={{ 
                    fontWeight: 700,
                    background: theme.palette.primary.gradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  My Appointments
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  boxShadow: 3,
                  background: theme.palette.primary.gradient,
                  alignSelf: { xs: 'stretch', sm: 'auto' }
                }}
                disabled={loading || loadingAction}
              >
                New Appointment
              </Button>
            </Box>

            {/* Appointment list */}
            {!loading && (
              <AppointmentList 
                appointments={appointments} 
                onEdit={handleOpenDialog} 
                onDelete={handleDelete} 
              />
            )}

            {/* Appointment form dialog */}
            <Dialog 
              open={openDialog} 
              onClose={handleCloseDialog} 
              maxWidth="md" 
              fullWidth
              PaperProps={{
                sx: { borderRadius: 3 }
              }}
            >
              <AppointmentForm
                formData={formData}
                setFormData={setFormData}
                formErrors={formErrors}
                selectedAppointment={selectedAppointment}
                services={services}
                employees={employees}
                availableTimeSlots={availableTimeSlots}
                handleServiceChange={handleServiceChange}
                handleEmployeeChange={handleEmployeeChange}
                handleSubmit={handleSubmit}
                handleCloseDialog={handleCloseDialog}
                getAvailableDates={() => getAvailableDates(
                  employees.find(e => e.id === formData.employee_id), 
                  services.find(s => s.id === formData.service_id)
                )}
              />
            </Dialog>
            
            {/* Loading action backdrop */}
            <Backdrop
              sx={{ 
                position: 'absolute',
                zIndex: 9999,
                color: '#fff',
                backgroundColor: 'rgba(255, 255, 255, 0.7)'
              }}
              open={loadingAction}
            >
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress color="primary" />
                <Typography variant="body2" sx={{ mt: 2, color: 'text.primary' }}>
                  Processing...
                </Typography>
              </Box>
            </Backdrop>
          </Paper>
        </Fade>
      </Box>
      
      {/* Snackbar notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%', boxShadow: 3 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Appointments;