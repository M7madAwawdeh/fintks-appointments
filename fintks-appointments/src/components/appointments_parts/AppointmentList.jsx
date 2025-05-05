import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Typography,
  Paper,
  Divider,
  Grid,
  Chip,
  Fade,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Videocam as VideocamIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useTheme } from '@mui/material/styles';

const AppointmentList = ({ appointments, onEdit, onDelete }) => {
  const theme = useTheme();
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [meetingPassword, setMeetingPassword] = useState('');
  const [currentMeeting, setCurrentMeeting] = useState(null);
  const [passwordError, setPasswordError] = useState(false);
  
  const handleJoinMeeting = (appointment) => {
    console.log('Join meeting clicked:', appointment);
    
    // Check if the appointment has meeting info either in meetingInfo object or directly in appointment
    if (appointment.meetingInfo) {
      console.log('Meeting info found in meetingInfo:', appointment.meetingInfo);
      setCurrentMeeting(appointment.meetingInfo);
      setPasswordDialog(true);
    } else if (appointment.meeting_link && appointment.meeting_password) {
      // If meeting info is directly in the appointment object
      console.log('Meeting info found directly in appointment');
      setCurrentMeeting({
        meeting_link: appointment.meeting_link,
        password: appointment.meeting_password
      });
      setPasswordDialog(true);
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
  
  return (
    <>
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
      
      {/* Appointment List */}
      <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
        {appointments.length === 0 ? (
          <Fade in={true} timeout={800}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 4, 
                textAlign: 'center', 
                my: 2,
                borderRadius: 3,
                background: theme.palette.background.gradient,
                border: '1px dashed rgba(0,0,0,0.1)'
              }}
            >
              <EventIcon sx={{ fontSize: 48, color: 'primary.light', mb: 2, opacity: 0.7 }} />
              <Typography variant="h6" gutterBottom>
                No appointments found
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Create a new one to get started with your scheduling
              </Typography>
            </Paper>
          </Fade>
        ) : (
          appointments.map((appointment, index) => {
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
                  <ListItem
                    sx={{ 
                      p: 3,
                      display: 'flex', 
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' }
                    }}
                    secondaryAction={
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        {/* Only show edit button for pending appointments */}
                        {appointment.status === 'pending' && (
                          <Tooltip title="Edit appointment">
                            <IconButton
                              edge="end"
                              aria-label="edit"
                              onClick={() => onEdit(appointment)}
                              sx={{ 
                                mr: 1,
                                color: theme.palette.primary.main,
                                '&:hover': { backgroundColor: 'rgba(37, 99, 235, 0.1)' }
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {/* Only show delete button for pending appointments or if completed/cancelled for more than 5 days */}
                        {(appointment.status === 'pending' || 
                          ((appointment.status === 'completed' || appointment.status === 'cancelled') && 
                           (new Date() - new Date(appointment.end_time)) / (1000 * 60 * 60 * 24) > 5)) && (
                          <Tooltip title="Delete appointment">
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => onDelete(appointment.id)}
                              sx={{ 
                                color: theme.palette.error.main,
                                '&:hover': { backgroundColor: 'rgba(220, 38, 38, 0.1)' }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    }
                  >
                    <Grid container spacing={2} sx={{ pr: { xs: 0, sm: 8 } }}>
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
                          <Chip 
                            size="small" 
                            label={`${duration} min`}
                            color="primary" 
                            variant="outlined"
                            sx={{ fontWeight: 'medium', ml: 1 }}
                          />
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
                          <EventIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {format(startTime, 'EEEE, MMMM d, yyyy')}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TimeIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {format(startTime, 'p')} - {format(endTime, 'p')}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      {/* Add Join Meeting button for confirmed appointments */}
                      {appointment.status === 'confirmed' && (
                        <Grid item xs={12} sx={{ mt: 2 }}>
                          <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<VideocamIcon />}
                            onClick={() => handleJoinMeeting(appointment)}
                            sx={{ 
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 'medium'
                            }}
                          >
                            Join Video Meeting
                          </Button>
                        </Grid>
                      )}
                    </Grid>
                  </ListItem>
                </Paper>
              </Fade>
            );
          })
        )}
      </List>
      
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
    </>
  );
};

export default AppointmentList;