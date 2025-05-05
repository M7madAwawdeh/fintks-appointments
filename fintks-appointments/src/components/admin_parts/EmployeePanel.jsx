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
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

function EmployeePanel() {
  const [employees, setEmployees] = useState([]);
  const [openEmployeeDialog, setOpenEmployeeDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    password: '',
    specialization: '',
    availability: Array(7).fill().map((_, index) => ({
      day_of_week: index,
      enabled: false,
      start_time: null,
      end_time: null,
    })),
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employees`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!selectedEmployee) {
        // First create the user account
        const userResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/users/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: employeeForm.name,
            email: employeeForm.email,
            password: employeeForm.password,
            role: 'employee'
          }),
        });

        const userData = await userResponse.json();
        if (!userResponse.ok) throw new Error(userData.error || 'Failed to create user account');

        // Then create the employee record
        const employeeResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/employees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userData.id,
            specialization: employeeForm.specialization,
          }),
        });

        const employeeData = await employeeResponse.json();
        if (!employeeResponse.ok) throw new Error(employeeData.error || 'Failed to create employee record');

        // Save availability for the employee
        const availabilityPromises = employeeForm.availability
          .filter((a) => a.enabled && a.start_time && a.end_time)
          .map(async (availability) => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employees/${employeeData.id}/availability`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                day_of_week: availability.day_of_week,
                start_time: formatTimeForAPI(availability.start_time),
                end_time: formatTimeForAPI(availability.end_time),
              }),
            });
            
            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || 'Failed to set availability');
            }
            return response.json();
          });

        await Promise.all(availabilityPromises);
      } else {
        // Update existing employee
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employees/${selectedEmployee.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            specialization: employeeForm.specialization,
            name: employeeForm.name,
            email: employeeForm.email
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update employee');

        // Update availability for existing employee
        // First, delete all existing availability records
        const deleteAvailabilityResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/api/employees/${selectedEmployee.id}/availability`,
          {
            method: 'GET',
          }
        );
        
        if (deleteAvailabilityResponse.ok) {
          const existingAvailability = await deleteAvailabilityResponse.json();
          
          // Delete each existing availability record
          const deletePromises = existingAvailability.map(async (avail) => {
            return fetch(
              `${import.meta.env.VITE_API_URL}/api/employees/${selectedEmployee.id}/availability/${avail.id}`,
              {
                method: 'DELETE',
              }
            );
          });
          
          await Promise.all(deletePromises);
        }
        
        // Then create new availability records for enabled days
        const availabilityPromises = employeeForm.availability
          .filter((a) => a.enabled && a.start_time && a.end_time)
          .map(async (availability) => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employees/${selectedEmployee.id}/availability`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                day_of_week: availability.day_of_week,
                start_time: formatTimeForAPI(availability.start_time),
                end_time: formatTimeForAPI(availability.end_time),
              }),
            });
            
            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || 'Failed to set availability');
            }
            return response.json();
          });

        await Promise.all(availabilityPromises);
      }

      fetchEmployees();
      setOpenEmployeeDialog(false);
      setSelectedEmployee(null);
      setEmployeeForm({
        name: '',
        email: '',
        password: '',
        specialization: '',
        availability: Array(7).fill().map((_, index) => ({
          day_of_week: index,
          enabled: false,
          start_time: null,
          end_time: null,
        })),
      });
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employees/${employeeId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete employee');

      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  // Parse time string (HH:MM) to Date object
  const parseTimeString = (timeStr) => {
    if (!timeStr) return null;
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    
    // Create date in UTC
    const date = new Date(Date.UTC(1970, 0, 1, hours, minutes));
    return date;
  };
  
  const handleEditEmployee = async (employee) => {
    setSelectedEmployee(employee);
    
    // Fetch employee availability
    try {
      const availabilityResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/employees/${employee.id}/availability`);
      const availabilityData = await availabilityResponse.json();
      
      // Create a default availability array with all days
      const defaultAvailability = Array(7).fill().map((_, index) => ({
        day_of_week: index,
        enabled: false,
        start_time: null,
        end_time: null,
      }));
      
      // Update the default availability with the fetched data
      if (availabilityResponse.ok && availabilityData.length > 0) {
        availabilityData.forEach(avail => {
          const dayIndex = avail.day_of_week;
          defaultAvailability[dayIndex] = {
            day_of_week: dayIndex,
            enabled: true,
            start_time: parseTimeString(avail.start_time),
            end_time: parseTimeString(avail.end_time),
            id: avail.id // Store the availability ID for updates
          };
        });
      }
      
      setEmployeeForm({
        name: employee.name,
        email: employee.email,
        specialization: employee.specialization,
        availability: defaultAvailability,
      });
    } catch (error) {
      console.error('Error fetching employee availability:', error);
      // If there's an error, still set the form with default availability
      setEmployeeForm({
        name: employee.name,
        email: employee.email,
        specialization: employee.specialization,
        availability: Array(7).fill().map((_, index) => ({
          day_of_week: index,
          enabled: false,
          start_time: null,
          end_time: null,
        })),
      });
    }
    
    setOpenEmployeeDialog(true);
  };

  const handleAvailabilityChange = (dayIndex, field, value) => {
    const newAvailability = [...employeeForm.availability];
    newAvailability[dayIndex] = {
      ...newAvailability[dayIndex],
      [field]: value,
    };
    setEmployeeForm({
      ...employeeForm,
      availability: newAvailability,
    });
  };
  
  // Format time to HH:MM string format for API
  const formatTimeForAPI = (timeDate) => {
    if (!timeDate) return null;
    
    // Convert to UTC before formatting
    const date = new Date(timeDate);
    if (isNaN(date.getTime())) return null;
    
    // Validate time format
    if (date.getUTCHours() < 0 || date.getUTCHours() > 23 || 
        date.getUTCMinutes() < 0 || date.getUTCMinutes() > 59) {
      throw new Error('Invalid time format');
    }
    
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getDayName = (index) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[index];
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Employee Management
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          setSelectedEmployee(null);
          setEmployeeForm({
            name: '',
            email: '',
            password: '',
            specialization: '',
            availability: Array(7).fill().map((_, index) => ({
              day_of_week: index,
              enabled: false,
              start_time: null,
              end_time: null,
            })),
          });
          setOpenEmployeeDialog(true);
        }}
        sx={{ mb: 2 }}
      >
        Add New Employee
      </Button>

      <List>
        {employees.map((employee) => (
          <ListItem key={employee.id}>
            <ListItemText
              primary={employee.name}
              secondary={`${employee.email} | ${employee.specialization}`}
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                aria-label="edit"
                onClick={() => handleEditEmployee(employee)}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => handleDeleteEmployee(employee.id)}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Dialog
        open={openEmployeeDialog}
        onClose={() => setOpenEmployeeDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedEmployee ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            type="text"
            fullWidth
            value={employeeForm.name}
            onChange={(e) =>
              setEmployeeForm({ ...employeeForm, name: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={employeeForm.email}
            onChange={(e) =>
              setEmployeeForm({ ...employeeForm, email: e.target.value })
            }
          />
          {!selectedEmployee && (
            <TextField
              margin="dense"
              label="Password"
              type="password"
              fullWidth
              value={employeeForm.password}
              onChange={(e) =>
                setEmployeeForm({ ...employeeForm, password: e.target.value })
              }
            />
          )}
          <TextField
            margin="dense"
            label="Specialization"
            type="text"
            fullWidth
            value={employeeForm.specialization}
            onChange={(e) =>
              setEmployeeForm({ ...employeeForm, specialization: e.target.value })
            }
          />

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Availability
          </Typography>
          {employeeForm.availability.map((day, index) => (
            <div key={index} style={{ marginBottom: '1rem' }}>
              <Typography variant="subtitle1">{getDayName(index)}</Typography>
              <FormControl component="fieldset">
                <Select
                  value={day.enabled}
                  onChange={(e) =>
                    handleAvailabilityChange(index, 'enabled', e.target.value)
                  }
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value={false}>Unavailable</MenuItem>
                  <MenuItem value={true}>Available</MenuItem>
                </Select>
              </FormControl>
              {day.enabled && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <TimePicker
                    label="Start Time"
                    value={day.start_time}
                    onChange={(newValue) =>
                      handleAvailabilityChange(index, 'start_time', newValue)
                    }
                  />
                  <TimePicker
                    label="End Time"
                    value={day.end_time}
                    onChange={(newValue) => {
                      if (newValue && day.start_time && newValue <= day.start_time) {
                        alert('End time must be after start time');
                        return;
                      }
                      handleAvailabilityChange(index, 'end_time', newValue);
                    }}
                    minTime={day.start_time}
                    minutesStep={15}
                  />
                </div>
              )}
            </div>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEmployeeDialog(false)}>Cancel</Button>
          <Button onClick={handleEmployeeSubmit} color="primary">
            {selectedEmployee ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default EmployeePanel;