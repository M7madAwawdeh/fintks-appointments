import React from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  Divider,
  Chip,
  CircularProgress,
  Fade
} from '@mui/material';
import {
  Event as EventIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useTheme } from '@mui/material/styles';

const AppointmentForm = ({
  formData,
  setFormData,
  formErrors,
  selectedAppointment,
  services,
  employees,
  availableTimeSlots,
  handleServiceChange,
  handleEmployeeChange,
  handleSubmit,
  handleCloseDialog,
  getAvailableDates
}) => {
  const theme = useTheme();
  
  return (
    <>
      <DialogTitle sx={{ 
        pb: 1, 
        background: theme.palette.background.gradient,
        borderBottom: '1px solid rgba(0,0,0,0.08)'
      }}>
        <Typography variant="h5" component="div" sx={{ 
          fontWeight: 700,
          background: theme.palette.primary.gradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {selectedAppointment ? 'Edit Appointment' : 'New Appointment'}
        </Typography>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent 
          sx={{ 
            pt: 3, 
            overflowY: 'auto', 
            maxHeight: '70vh',  // Limit height to 70% of viewport height
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: theme.palette.background.default,
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: theme.palette.primary.light,
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: theme.palette.primary.main,
            },
            scrollbarWidth: 'thin',
            scrollbarColor: `${theme.palette.primary.light} ${theme.palette.background.default}`,
          }}
        >
          <Fade in={true} timeout={400}>
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Appointment Details
              </Typography>
              
              <TextField
                fullWidth
                margin="normal"
                label="Appointment Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                error={!!formErrors.title}
                helperText={formErrors.title || ''}
                required
                InputProps={{
                  sx: { borderRadius: 2 }
                }}
              />
              
              <TextField
                fullWidth
                margin="normal"
                label="Description (optional)"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                InputProps={{
                  sx: { borderRadius: 2 }
                }}
              />
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                Service & Provider
              </Typography>
              
              <FormControl fullWidth margin="normal" error={!!formErrors.service_id}>
                <InputLabel>Select Service</InputLabel>
                <Select
                  value={formData.service_id}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  required
                  sx={{ borderRadius: 2 }}
                >
                  {services.map((service) => (
                    <MenuItem key={service.id} value={service.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <Typography variant="body1">{service.name}</Typography>
                        <Box>
                          <Chip 
                            size="small" 
                            label={`${service.duration} min`} 
                            color="primary" 
                            variant="outlined"
                            sx={{ mr: 1, fontWeight: 'medium' }}
                          />
                          <Chip 
                            size="small" 
                            label={`$${service.price}`} 
                            color="secondary" 
                            sx={{ fontWeight: 'medium' }}
                          />
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.service_id && (
                  <Typography color="error" variant="caption">
                    {formErrors.service_id}
                  </Typography>
                )}
              </FormControl>

              <FormControl fullWidth margin="normal" error={!!formErrors.employee_id}>
                <InputLabel>Select Provider</InputLabel>
                <Select
                  value={formData.employee_id}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  required
                  sx={{ borderRadius: 2 }}
                  startAdornment={formData.employee_id ? <PersonIcon sx={{ ml: 1, mr: 1, color: 'primary.main' }} /> : null}
                >
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <PersonIcon sx={{ mr: 1, color: 'primary.light' }} />
                        <Typography variant="body1">{employee.name}</Typography>
                        {employee.specialization && (
                          <Chip 
                            size="small" 
                            label={employee.specialization} 
                            sx={{ ml: 'auto', fontWeight: 'medium' }}
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.employee_id && (
                  <Typography color="error" variant="caption">
                    {formErrors.employee_id}
                  </Typography>
                )}
              </FormControl>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
                Date & Time
              </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" error={!!formErrors.start_time}>
                <InputLabel>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EventIcon sx={{ mr: 0.5, fontSize: 18 }} />
                    Available Dates
                  </Box>
                </InputLabel>
                <Select
                  value={formData.start_time ? `${formData.start_time.getFullYear()}-${String(formData.start_time.getMonth() + 1).padStart(2, '0')}-${String(formData.start_time.getDate()).padStart(2, '0')}` : ''}
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value);
                    // Ensure time is set to midnight to avoid timezone issues
                    selectedDate.setHours(0, 0, 0, 0);
                    setFormData({ 
                      ...formData, 
                      start_time: selectedDate,
                    });
                  }}
                  disabled={!formData.employee_id || !formData.service_id}
                  sx={{ borderRadius: 2 }}
                  MenuProps={{
                    PaperProps: {
                      sx: { maxHeight: 300 }
                    }
                  }}
                >
                  {!formData.employee_id || !formData.service_id ? (
                    <MenuItem disabled>
                      <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                        <EventIcon sx={{ mr: 1, opacity: 0.6 }} />
                        Select employee and service first
                      </Box>
                    </MenuItem>
                  ) : (
                    getAvailableDates(
                      employees.find(e => e.id === formData.employee_id),
                      services.find(s => s.id === formData.service_id)
                    ).map((date) => {
                      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                      const isToday = new Date().toDateString() === date.toDateString();
                      
                      return (
                        <MenuItem 
                          key={dateKey} 
                          value={dateKey}
                          sx={{
                            borderLeft: isToday ? `3px solid ${theme.palette.primary.main}` : 'none',
                            pl: isToday ? 1 : 2
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <Typography variant="body1">
                              {format(date, 'EEE, MMM d')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                              {format(date, 'yyyy')}
                            </Typography>
                            {isToday && (
                              <Chip 
                                size="small" 
                                label="Today" 
                                color="primary" 
                                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        </MenuItem>
                      );
                    })
                  )}
                </Select>
                {formErrors.start_time && (
                  <Typography color="error" variant="caption">
                    {formErrors.start_time}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" error={!availableTimeSlots.length && formData.start_time}>
                <InputLabel>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TimeIcon sx={{ mr: 0.5, fontSize: 18 }} />
                    Available Times
                  </Box>
                </InputLabel>
                <Select
                  value={formData.start_time && typeof formData.start_time.getHours === 'function' ? 
                    `${formData.start_time.getHours()}:${String(formData.start_time.getMinutes()).padStart(2, '0')}` : ''}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':').map(Number);
                    const newDateTime = new Date(formData.start_time);
                    newDateTime.setHours(hours);
                    newDateTime.setMinutes(minutes);
                    setFormData({ ...formData, start_time: newDateTime });
                  }}
                  disabled={!formData.employee_id || !formData.service_id || !formData.start_time || !availableTimeSlots.length}
                  sx={{ borderRadius: 2 }}
                  MenuProps={{
                    PaperProps: {
                      sx: { maxHeight: 300 }
                    }
                  }}
                >
                  {!formData.start_time ? (
                    <MenuItem disabled>
                      <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                        <TimeIcon sx={{ mr: 1, opacity: 0.6 }} />
                        Select a date first
                      </Box>
                    </MenuItem>
                  ) : !availableTimeSlots.length ? (
                    <MenuItem disabled>
                      <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                        <TimeIcon sx={{ mr: 1, opacity: 0.6 }} />
                        No available time slots
                      </Box>
                    </MenuItem>
                  ) : (
                    availableTimeSlots.map((slot, index) => {
                      const timeValue = `${slot.getHours()}:${String(slot.getMinutes()).padStart(2, '0')}`;
                      const formattedTime = slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const service = services.find(s => s.id === formData.service_id);
                      const endTime = new Date(slot.getTime() + (service?.duration || 0) * 60000);
                      const formattedEndTime = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      
                      return (
                        <MenuItem 
                          key={slot.getTime()} 
                          value={timeValue}
                          sx={{
                            borderLeft: index === 0 ? `3px solid ${theme.palette.success.main}` : 'none',
                            pl: index === 0 ? 1 : 2
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <TimeIcon sx={{ mr: 1, color: 'primary.light', fontSize: 18 }} />
                            <Typography variant="body1">
                              {formattedTime}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                              - {formattedEndTime}
                            </Typography>
                            {index === 0 && (
                              <Chip 
                                size="small" 
                                label="Earliest" 
                                color="success" 
                                sx={{ ml: 'auto', height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        </MenuItem>
                      );
                    })
                  )}
                </Select>
                {formData.start_time && !availableTimeSlots.length && (
                  <Typography color="error" variant="caption">
                    No available times on this date. Please select another date.
                  </Typography>
                )}
              </FormControl>
            </Grid>
          </Grid>
          
          {formData.start_time && formData.start_time.getHours && formData.service_id && (
            <Fade in={true} timeout={500}>
              <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(37, 99, 235, 0.05)', borderRadius: 2, border: '1px solid rgba(37, 99, 235, 0.1)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                  Appointment Summary
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EventIcon sx={{ mr: 1, color: 'primary.main', fontSize: 18 }} />
                      <Typography variant="body2">
                        {format(formData.start_time, 'EEEE, MMMM d, yyyy')}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TimeIcon sx={{ mr: 1, color: 'primary.main', fontSize: 18 }} />
                      <Typography variant="body2">
                        {format(formData.start_time, 'h:mm a')}
                        {formData.service_id && ` - ${format(new Date(formData.start_time.getTime() + (services.find(s => s.id === formData.service_id)?.duration || 0) * 60000), 'h:mm a')}`}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Fade>
          )}
            </Box>
          </Fade>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          <Button 
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            sx={{ 
              borderRadius: 2, 
              px: 3,
              background: theme.palette.primary.gradient,
              boxShadow: '0 4px 8px rgba(37, 99, 235, 0.2)'
            }}
          >
            {selectedAppointment ? 'Update Appointment' : 'Create Appointment'}
          </Button>
        </DialogActions>
      </form>
    </>
  );
};

export default AppointmentForm;
