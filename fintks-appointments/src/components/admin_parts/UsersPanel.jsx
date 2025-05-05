import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Box,
  Chip,
  Avatar,
  Tooltip,
  CircularProgress,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  IconButton
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  AdminPanelSettings as AdminIcon,
  Work as EmployeeIcon,
  PersonOutline as UserIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

function UsersPanel() {
  const theme = useTheme();
  const [users, setUsers] = useState([]);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    appointment_limit: 3,
    specialization: ''
  });

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

  // Fetch users with improved error handling and token validation
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      let storedUser;
      try {
        storedUser = JSON.parse(localStorage.getItem('user'));
      } catch (e) {
        localStorage.removeItem('user');
        throw new Error('Invalid user data. Please log in again.');
      }

      if (!storedUser || !storedUser.token) {
        localStorage.removeItem('user');
        throw new Error('Authentication token not found. Please log in again.');
      }

      if (storedUser.role !== 'admin') {
        throw new Error('Access denied. Admin privileges required.');
      }
      
      // Add token expiration check
      const tokenParts = storedUser.token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      try {
        const payload = JSON.parse(atob(tokenParts[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          localStorage.removeItem('user');
          throw new Error('Your session has expired. Please log in again.');
        }
      } catch (e) {
        console.error('Error checking token expiration:', e);
      }

      // Fetch users with employee information to ensure correct role display
      // Fetch users with employee information to ensure correct role display
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${storedUser.token}`,
          'Content-Type': 'application/json'
        },
        // Add cache control to ensure fresh data
        cache: 'no-cache'
      });

      let data;
      try {
        const responseText = await response.text();
        data = responseText ? JSON.parse(responseText) : [];
      } catch (e) {
        console.error('Error parsing response:', e);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('user');
          throw new Error('Authentication failed or session expired. Please log in again.');
        }
        throw new Error(data.error || 'Failed to fetch users');
      }

      // Check for employee records and ensure roles are correctly set
      const usersWithCorrectRoles = await Promise.all(data.map(async (user) => {
        // If the user role is already 'employee', verify it has an employee record
        if (user.role === 'employee') {
          return user;
        }
        
        // Check if this user has an employee record but role is not set correctly
        try {
          const employeeResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/employees`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${storedUser.token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (employeeResponse.ok) {
            const employees = await employeeResponse.json();
            // If this user has an employee record, ensure role is set to 'employee'
            const isEmployee = employees.some(emp => emp.user_id === user.id);
            if (isEmployee && user.role !== 'employee') {
              return { ...user, role: 'employee' };
            }
          }
        } catch (error) {
          console.error('Error checking employee records:', error);
        }
        
        return user;
      }));
      
      setUsers(usersWithCorrectRoles);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
      if (error.message.includes('Authentication') || error.message.includes('Invalid user data')) {
        localStorage.removeItem('user');
      }
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, []);

  // Reset form to initial state
  const resetForm = () => {
    setUserForm({
      name: '',
      email: '',
      password: '',
      role: 'user',
      appointment_limit: 3,
      specialization: ''
    });
    setSelectedUser(null);
  };

  // Handle user submission (create/update)
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (!storedUser || !storedUser.token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      const token = storedUser.token;

      const endpoint = selectedUser 
        ? `${import.meta.env.VITE_API_URL}/api/users/${selectedUser.id}` 
        : `${import.meta.env.VITE_API_URL}/api/users/register`;
      
      const method = selectedUser ? 'PUT' : 'POST';
      
      const payload = selectedUser 
        ? { 
            name: userForm.name, 
            email: userForm.email, 
            role: userForm.role,
            appointment_limit: userForm.appointment_limit 
          }
        : userForm;

      const response = await fetch(endpoint, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save user');
      }

      // If creating a new employee, create the employee record and ensure role is set correctly
      if (!selectedUser && userForm.role === 'employee' && data.id) {
        try {
          const employeeResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/employees`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              user_id: data.id,
              specialization: userForm.specialization || 'employee'
            })
          });

          const employeeData = await employeeResponse.json();
          if (!employeeResponse.ok) {
            throw new Error(employeeData.error || 'Failed to create employee record');
          }
        } catch (error) {
          // Clean up the user record if employee creation fails
          try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/users/${data.id}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
          } catch (cleanupError) {
            console.error('Error cleaning up user record:', cleanupError);
          }
          throw new Error(`Error creating employee: ${error.message}`);
        }
      }

      // Fetch updated users list
      fetchUsers();
      
      // Reset form and dialog
      setOpenUserDialog(false);
      setSelectedUser(null);
      resetForm();
      
      // Show success message
      setSnackbar({
        open: true,
        message: `User ${selectedUser ? 'updated' : 'created'} successfully`,
        severity: 'success'
      });

    } catch (error) {
      setError(error.message);
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
      setLoading(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (!storedUser || !storedUser.token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      const token = storedUser.token;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(data.error || 'Failed to delete user');
      }

      // Show success message
      setSnackbar({
        open: true,
        message: 'User deleted successfully',
        severity: 'success'
      });

      // Refresh users list
      fetchUsers();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
    }
  };

  // Handle editing a user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      appointment_limit: user.appointment_limit || 3,
      specialization: ''
    });
    setOpenUserDialog(true);
  };

  // Handle opening new user dialog
  const handleNewUser = () => {
    resetForm();
    setOpenUserDialog(true);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 4, 
        borderRadius: 2,
        background: theme.palette.background.paper,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 700,
            background: theme.palette.primary.gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Users Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleNewUser}
          startIcon={<AddIcon />}
          sx={{ 
            borderRadius: 2,
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            background: theme.palette.primary.gradient,
          }}
        >
          Add New User
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress size={30} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Loading users...
          </Typography>
        </Box>
      ) : users.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No users found
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {users.map((user) => (
            <Grid item xs={12} key={user.id}>
              <Card 
                sx={{ 
                  borderRadius: 2,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.12)'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: user.role === 'admin' ? theme.palette.error.main : 
                                  user.role === 'employee' ? theme.palette.success.main : 
                                  theme.palette.primary.main,
                          mr: 2
                        }}
                      >
                        {user.role === 'admin' ? <AdminIcon /> : 
                         user.role === 'employee' ? <EmployeeIcon /> : 
                         <UserIcon />}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {user.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <Chip 
                            label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            size="small"
                            sx={{ 
                              mr: 1,
                              bgcolor: user.role === 'admin' ? 'error.light' : 
                                      user.role === 'employee' ? 'success.light' : 
                                      'primary.light',
                              color: user.role === 'admin' ? 'error.dark' : 
                                     user.role === 'employee' ? 'success.dark' : 
                                     'primary.dark',
                            }}
                          />
                          <Chip 
                            label={`Limit: ${user.appointment_limit || 'Unlimited'}`}
                            size="small"
                            sx={{ bgcolor: 'background.default' }}
                          />
                        </Box>
                      </Box>
                    </Box>
                    <Box>
                      <Tooltip title="Edit User">
                        <IconButton
                          color="primary"
                          onClick={() => handleEditUser(user)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete User">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog 
        open={openUserDialog} 
        onClose={() => setOpenUserDialog(false)}
        PaperProps={{
          sx: { borderRadius: 2, maxWidth: 500 }
        }}
      >
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
            {selectedUser ? 'Edit User' : 'Add New User'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                label="Full Name"
                type="text"
                fullWidth
                value={userForm.name}
                onChange={(e) =>
                  setUserForm({ ...userForm, name: e.target.value })
                }
                InputProps={{
                  sx: { borderRadius: 2 }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
                InputProps={{
                  sx: { borderRadius: 2 }
                }}
              />
            </Grid>
            {!selectedUser && (
              <Grid item xs={12}>
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  value={userForm.password}
                  onChange={(e) =>
                    setUserForm({ ...userForm, password: e.target.value })
                  }
                  InputProps={{
                    sx: { borderRadius: 2 }
                  }}
                  helperText="Password must be at least 8 characters long"
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>User Role</InputLabel>
                <Select
                  value={userForm.role}
                  label="User Role"
                  onChange={(e) =>
                    setUserForm({ ...userForm, role: e.target.value })
                  }
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="user">Regular User</MenuItem>
                  <MenuItem value="employee">Employee</MenuItem>
                  <MenuItem value="admin">Administrator</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Appointment Limit"
                type="number"
                fullWidth
                value={userForm.appointment_limit}
                onChange={(e) =>
                  setUserForm({ ...userForm, appointment_limit: parseInt(e.target.value) || 0 })
                }
                InputProps={{
                  sx: { borderRadius: 2 }
                }}
                helperText="Set to 0 for unlimited appointments"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setOpenUserDialog(false)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUserSubmit} 
            variant="contained"
            sx={{ 
              borderRadius: 2,
              background: theme.palette.primary.gradient,
            }}
          >
            {selectedUser ? 'Update User' : 'Create User'}
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
        <Alert 
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Loading overlay */}
      {loading && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            backgroundColor: 'rgba(255,255,255,0.7)', 
            zIndex: 1000 
          }}
        >
          <CircularProgress />
        </Box>
      )}
      </Paper>
    );
  }
  
  export default UsersPanel;