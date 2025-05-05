import { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Box,
  Divider,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Fade,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar
} from '@mui/material';
import { fetchEmployeeAppointments, updateAppointmentStatus } from './appointments_parts/appointmentsApi';
import { 
  Event as EventIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Today as TodayIcon,
  CalendarMonth as CalendarMonthIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Videocam as VideocamIcon,
  Lock as LockIcon,
  Done as DoneIcon,
  NoteAlt as NoteAltIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

function EmployeeDashboard() {
  const theme = useTheme();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [meetingPassword, setMeetingPassword] = useState('');
  const [currentMeeting, setCurrentMeeting] = useState(null);
  const [passwordError, setPasswordError] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelNote, setCancelNote] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0
  });
  
  const handleJoinMeeting = (appointment) => {
    console.log('Join meeting clicked:', appointment);
    
    // For employees, bypass password verification and open meeting directly
    if (appointment.meetingInfo) {
      console.log('Meeting info found in meetingInfo, opening directly for employee');
      window.open(appointment.meetingInfo.meeting_link, '_blank');
    } else if (appointment.meeting_link && appointment.meeting_password) {
      // If meeting info is directly in the appointment object
      console.log('Meeting info found directly in appointment, opening directly for employee');
      window.open(appointment.meeting_link, '_blank');
    } else if (appointment.meeting_link) {
      // If there's only a meeting link without password, open it directly
      console.log('Only meeting link found, opening directly');
      window.open(appointment.meeting_link, '_blank');
    } else {
      // No meeting information found
      console.error('No meeting information available for this appointment');
      alert('No meeting information available for this appointment. Please contact support.');
    }
  };
  
  const handlePasswordSubmit = () => {
    if (currentMeeting && meetingPassword === currentMeeting.password) {
      // Password is correct, open the meeting link
      window.open(currentMeeting.meeting_link, '_blank');
      setPasswordDialog(false);
      setMeetingPassword('');
      setPasswordError(false);
    } else {
      // Password is incorrect
      setPasswordError(true);
    }
  };
  
  const handlePasswordDialogClose = () => {
    setPasswordDialog(false);
    setMeetingPassword('');
    setPasswordError(false);
  };
  
  // Handle appointment status updates
  const handleConfirmAppointment = async (appointment) => {
    try {
      await updateAppointmentStatus(appointment.id, 'confirmed');
      setSnackbar({
        open: true,
        message: 'Appointment confirmed successfully! An email has been sent to the client.',
        severity: 'success'
      });
      fetchAppointments();
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to confirm appointment: ${error.message}`,
        severity: 'error'
      });
    }
  };
  
  const handleCompleteAppointment = async (appointment) => {
    try {
      await updateAppointmentStatus(appointment.id, 'completed');
      setSnackbar({
        open: true,
        message: 'Appointment marked as completed!',
        severity: 'success'
      });
      fetchAppointments();
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to complete appointment: ${error.message}`,
        severity: 'error'
      });
    }
  };
  
  const handleOpenCancelDialog = (appointment) => {
    setSelectedAppointment(appointment);
    setCancelNote('');
    setCancelDialog(true);
  };
  
  const handleCloseCancelDialog = () => {
    setCancelDialog(false);
    setCancelNote('');
    setSelectedAppointment(null);
  };
  
  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    
    try {
      await updateAppointmentStatus(selectedAppointment.id, 'cancelled', cancelNote);
      setSnackbar({
        open: true,
        message: 'Appointment cancelled successfully! An email has been sent to the client.',
        severity: 'success'
      });
      handleCloseCancelDialog();
      fetchAppointments();
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to cancel appointment: ${error.message}`,
        severity: 'error'
      });
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05,
        delayChildren: 0.2
      } 
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  useEffect(() => {
    if (user && user.role === 'employee') {
      fetchAppointments();
    }
  }, [user, tabValue]);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch appointments for the employee using the API function
      const processedAppointments = await fetchEmployeeAppointments(user.employee_id);
      
      // Filter appointments based on tab value
      let filteredAppointments = processedAppointments;
      
      if (tabValue === 1) { // Today's appointments
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        filteredAppointments = processedAppointments.filter(app => {
          const appDate = new Date(app.start_time);
          appDate.setHours(0, 0, 0, 0);
          return appDate.getTime() === today.getTime();
        });
      } else if (tabValue === 2) { // Pending appointments
        filteredAppointments = processedAppointments.filter(app => app.status === 'pending');
      } else if (tabValue === 3) { // Confirmed appointments
        filteredAppointments = processedAppointments.filter(app => app.status === 'confirmed');
      } else if (tabValue === 4) { // Completed appointments
        filteredAppointments = processedAppointments.filter(app => app.status === 'completed');
      } else if (tabValue === 5) { // Cancelled appointments
        filteredAppointments = processedAppointments.filter(app => app.status === 'cancelled');
      }
      
      // Sort appointments by start time
      filteredAppointments.sort((a, b) => a.start_time - b.start_time);
      
      setAppointments(filteredAppointments);
      
      // Calculate statistics
      const newStats = {
        total: processedAppointments.length,
        pending: processedAppointments.filter(app => app.status === 'pending').length,
        confirmed: processedAppointments.filter(app => app.status === 'confirmed').length,
        completed: processedAppointments.filter(app => app.status === 'completed').length,
        cancelled: processedAppointments.filter(app => app.status === 'cancelled').length
      };
      
      setStats(newStats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return (
          <Chip 
            icon={<PendingIcon />} 
            label="Pending" 
            size="small" 
            color="warning" 
            variant="outlined" 
          />
        );
      case 'confirmed':
        return (
          <Chip 
            icon={<CheckCircleIcon />} 
            label="Confirmed" 
            size="small" 
            color="success" 
            variant="outlined" 
          />
        );
      case 'completed':
        return (
          <Chip 
            icon={<CheckCircleIcon />} 
            label="Completed" 
            size="small" 
            color="success" 
            variant="filled" 
          />
        );
      case 'cancelled':
        return (
          <Chip 
            icon={<CancelIcon />} 
            label="Cancelled" 
            size="small" 
            color="error" 
            variant="outlined" 
          />
        );
      default:
        return (
          <Chip 
            label={status} 
            size="small" 
            color="default" 
            variant="outlined" 
          />
        );
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Password Dialog */}
      <Dialog open={passwordDialog} onClose={handlePasswordDialogClose}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LockIcon sx={{ mr: 1, color: 'primary.main' }} />
            Enter Meeting Password
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please enter the meeting password that was sent to you in the appointment confirmation email.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Meeting Password"
            type="text"
            fullWidth
            variant="outlined"
            value={meetingPassword}
            onChange={(e) => setMeetingPassword(e.target.value)}
            error={passwordError}
            helperText={passwordError ? 'Incorrect password. Please check your email for the correct password.' : ''}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePasswordDialogClose}>Cancel</Button>
          <Button onClick={handlePasswordSubmit} variant="contained" color="primary">
            Join Meeting
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Cancellation Dialog */}
      <Dialog open={cancelDialog} onClose={handleCloseCancelDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CancelIcon sx={{ mr: 1, color: 'error.main' }} />
            Cancel Appointment
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please provide a reason for cancellation. This will be included in the email sent to the client.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Cancellation Reason"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={cancelNote}
            onChange={(e) => setCancelNote(e.target.value)}
            placeholder="Please explain why this appointment is being cancelled..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog}>Back</Button>
          <Button 
            onClick={handleCancelAppointment} 
            variant="contained" 
            color="error"
            disabled={!cancelNote.trim()}
          >
            Cancel Appointment
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
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
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          borderRadius: 3,
          mb: 3,
          background: theme.palette.background.gradient,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <EventIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h5" component="h1" fontWeight="bold">
            Employee Appointments Dashboard
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          View and manage all appointments assigned to you
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
          <Grid item xs={12} sm={6} md={2}>
            <motion.div variants={itemVariants}>
              <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Total
                  </Typography>
                  <Typography variant="h3" color="primary">
                    {stats.total}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <motion.div variants={itemVariants}>
              <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Pending
                  </Typography>
                  <Typography variant="h3" color="warning.main">
                    {stats.pending}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <motion.div variants={itemVariants}>
              <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Confirmed
                  </Typography>
                  <Typography variant="h3" color="success.main">
                    {stats.confirmed}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <motion.div variants={itemVariants}>
              <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Completed
                  </Typography>
                  <Typography variant="h3" color="success.dark">
                    {stats.completed}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <motion.div variants={itemVariants}>
              <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Cancelled
                  </Typography>
                  <Typography variant="h3" color="error.main">
                    {stats.cancelled}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Tabs for filtering appointments */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            aria-label="appointment tabs"
          >
            <Tab icon={<EventIcon />} label="All" iconPosition="start" />
            <Tab icon={<TodayIcon />} label="Today" iconPosition="start" />
            <Tab icon={<PendingIcon />} label="Pending" iconPosition="start" />
            <Tab icon={<CheckCircleIcon />} label="Confirmed" iconPosition="start" />
            <Tab icon={<CheckCircleIcon />} label="Completed" iconPosition="start" />
            <Tab icon={<CancelIcon />} label="Cancelled" iconPosition="start" />
          </Tabs>
        </Box>

        {/* Loading and Error States */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Appointments List */}
        {!loading && !error && appointments.length === 0 && (
          <Fade in={true} timeout={800}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 4, 
                textAlign: 'center', 
                my: 2,
                borderRadius: 3,
                background: theme.palette.background.paper,
                border: '1px dashed rgba(0,0,0,0.1)'
              }}
            >
              <EventIcon sx={{ fontSize: 48, color: 'primary.light', mb: 2, opacity: 0.7 }} />
              <Typography variant="h6" gutterBottom>
                No appointments found
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {tabValue === 0 ? 'You have no appointments assigned to you yet.' :
                 tabValue === 1 ? 'You have no appointments scheduled for today.' :
                 tabValue === 2 ? 'You have no pending appointments.' :
                 tabValue === 3 ? 'You have no confirmed appointments.' :
                 tabValue === 4 ? 'You have no completed appointments.' :
                 'You have no cancelled appointments.'}
              </Typography>
            </Paper>
          </Fade>
        )}

        {!loading && !error && appointments.length > 0 && (
          <motion.div variants={containerVariants}>
            {appointments.map((appointment, index) => {
              const startTime = appointment.start_time;
              const endTime = appointment.end_time;
              const duration = Math.round((endTime - startTime) / (1000 * 60)); // in minutes

              return (
                <Fade 
                  in={true} 
                  timeout={500} 
                  style={{ transitionDelay: `${index * 100}ms` }}
                  key={appointment.id}
                >
                  <motion.div variants={itemVariants}>
                    <Paper 
                      elevation={3} 
                      sx={{ 
                        mb: 2, 
                        borderRadius: 3,
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        borderLeft: `4px solid ${theme.palette.primary.main}`,
                        '&:hover': {
                          boxShadow: 6,
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Box sx={{ p: 3 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                              <Typography variant="h6" component="div" sx={{ 
                                fontWeight: 'bold',
                                background: theme.palette.primary.gradient,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                              }}>
                                {appointment.title}
                              </Typography>
                              <Box>
                                {getStatusChip(appointment.status)}
                                <Chip 
                                  size="small" 
                                  label={`${duration} min`}
                                  color="primary" 
                                  variant="outlined"
                                  sx={{ fontWeight: 'medium', ml: 1 }}
                                />
                              </Box>
                            </Box>
                          </Grid>
                          {appointment.description && (
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">
                                {appointment.description}
                              </Typography>
                            </Grid>
                          )}
                          <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CalendarMonthIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                              <Typography variant="body2" color="text.secondary">
                                {format(startTime, 'EEEE, MMMM d, yyyy')}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <TimeIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                              <Typography variant="body2" color="text.secondary">
                                {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PersonIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                              <Typography variant="body2" color="text.secondary">
                                Client: {appointment.user_name}
                              </Typography>
                            </Box>
                            
                            {/* Action buttons based on appointment status */}
                            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {/* Pending appointment actions */}
                              {appointment.status === 'pending' && (
                                <>
                                  <Button
                                    variant="outlined"
                                    color="success"
                                    size="small"
                                    startIcon={<CheckCircleIcon />}
                                    onClick={() => handleConfirmAppointment(appointment)}
                                    sx={{ 
                                      borderRadius: 2,
                                      textTransform: 'none',
                                      fontWeight: 'medium'
                                    }}
                                  >
                                    Confirm
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    startIcon={<CancelIcon />}
                                    onClick={() => handleOpenCancelDialog(appointment)}
                                    sx={{ 
                                      borderRadius: 2,
                                      textTransform: 'none',
                                      fontWeight: 'medium'
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              )}
                              
                              {/* Confirmed appointment actions */}
                              {appointment.status === 'confirmed' && (
                                <>
                                  <Button
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                    startIcon={<VideocamIcon />}
                                    onClick={() => handleJoinMeeting(appointment)}
                                    sx={{ 
                                      borderRadius: 2,
                                      textTransform: 'none',
                                      fontWeight: 'medium'
                                    }}
                                  >
                                    Join Meeting
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    color="success"
                                    size="small"
                                    startIcon={<DoneIcon />}
                                    onClick={() => handleCompleteAppointment(appointment)}
                                    sx={{ 
                                      borderRadius: 2,
                                      textTransform: 'none',
                                      fontWeight: 'medium'
                                    }}
                                  >
                                    Complete
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    startIcon={<CancelIcon />}
                                    onClick={() => handleOpenCancelDialog(appointment)}
                                    sx={{ 
                                      borderRadius: 2,
                                      textTransform: 'none',
                                      fontWeight: 'medium'
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              )}
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              Service: {appointment.service_name}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    </Paper>
                  </motion.div>
                </Fade>
              );
            })}
          </motion.div>
        )}
      </Paper>
    </motion.div>
  );
}

export default EmployeeDashboard;