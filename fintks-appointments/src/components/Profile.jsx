import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Divider,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  Snackbar,
  IconButton,
} from '@mui/material';
import { Delete as DeleteIcon, Save as SaveIcon, Lock as LockIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const { user, logout, validateToken } = useAuth();  // Ensure validateToken is destructured
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    role: '',
  });
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [pendingAppointmentsCount, setPendingAppointmentsCount] = useState(0);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [updatePassword, setUpdatePassword] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name,
        email: user.email,
        role: user.role,
      });
      fetchAppointmentsData(user.id);
    }
  }, [user]);

  const fetchAppointmentsData = async (userId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments?user_id=${userId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setAppointmentsCount(data.length);
      setPendingAppointmentsCount(data.filter(app => app.status === 'pending').length);
    } catch (error) {
      console.error('Error fetching appointments data:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!updatePassword) {
      setSnackbar({
        open: true,
        message: 'Please enter your password to confirm changes',
        severity: 'error',
      });
      return;
    }
  
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`  // Add authorization header
        },
        body: JSON.stringify({
          userId: user.id,
          name: profileData.name,
          email: profileData.email,
          password: updatePassword,
        }),
      });
  
      const responseText = await response.text();
      
      if (!response.ok) {
        try {
          const data = JSON.parse(responseText);
          throw new Error(data.error || 'Failed to update profile');
        } catch {
          console.error('Non-JSON response:', responseText);
          throw new Error(`Server error: ${response.statusText}`);
        }
      }
  
      const data = JSON.parse(responseText);
  
      // Update local storage with new user data
      const updatedUser = { ...user, name: profileData.name, email: profileData.email };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setSnackbar({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success',
      });
      setUpdatePassword('');
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbar({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error',
      });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match.');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to change password');
      }

      alert('Password changed successfully.');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleOpenDeleteDialog = () => {
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDeletePassword('');
  };

  const handleDeleteAccount = async () => {
  if (!deletePassword) {
    setSnackbar({
      open: true,
      message: 'Please enter your password to confirm account deletion',
      severity: 'error',
    });
    return;
  }

  try {
    // Validate token before making the request
    if (!validateToken()) {
      setSnackbar({
        open: true,
        message: 'Your session has expired. Please log in again.',
        severity: 'error',
      });
      setTimeout(() => logout(), 2000);
      return;
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/account/${user.id}`, { // <-- Corrected route
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({
        password: deletePassword
      })
    });

    const responseText = await response.text();

    if (!response.ok) {
      if (response.status === 401) { // Backend sends 401 for invalid password
        setSnackbar({
          open: true,
          message: 'Invalid password', // More specific message
          severity: 'error',
        });
        return;
      }
      throw new Error(`Server error: ${response.statusText}`);
    }

    setSnackbar({
      open: true,
      message: 'Account successfully deleted',
      severity: 'success',
    });

    setTimeout(() => {
      logout();
      navigate('/');
    }, 1000);

  } catch (error) {
    console.error('Error deleting account:', error);
    setSnackbar({
      open: true,
      message: `Error: ${error.message}`,
      severity: 'error',
    });
  } finally {
    handleCloseDeleteDialog();
  }
};

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
            {profileData.role} : {profileData.name}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="h6">User Information</Typography>
              <form onSubmit={handleSubmit}>
                <TextField
                  label="Name"
                  name="name"
                  value={profileData.name}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="Email"
                  name="email"
                  value={profileData.email}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="Enter Password to Confirm Changes"
                  type="password"
                  value={updatePassword}
                  onChange={(e) => setUpdatePassword(e.target.value)}
                  fullWidth
                  margin="normal"
                  required
                />
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary" 
                  sx={{ mt: 2 }}
                  startIcon={<SaveIcon />}
                >
                  Update Profile
                </Button>
              </form>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="h6">Appointments</Typography>
              <Typography variant="body1">Total Appointments: {appointmentsCount}</Typography>
              <Typography variant="body1">Pending Appointments: {pendingAppointmentsCount}</Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 3 }} />
          
          {/* Password Reset Section */}
          <Typography variant="h6" sx={{ mb: 2 }}>Reset Password</Typography>
          <form onSubmit={handlePasswordSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Current Password"
                  type="password"
                  name="oldPassword"
                  value={passwordData.oldPassword}
                  onChange={handlePasswordChange}
                  fullWidth
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="New Password"
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  fullWidth
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Confirm New Password"
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  fullWidth
                  margin="normal"
                  required
                />
              </Grid>
            </Grid>
            <Button 
              type="submit" 
              variant="contained" 
              color="secondary" 
              sx={{ mt: 2 }}
              startIcon={<LockIcon />}
            >
              Change Password
            </Button>
          </form>
          
          <Divider sx={{ my: 3 }} />
          
          {/* Delete Account Section */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" color="error">Danger Zone</Typography>
            <Button 
              variant="outlined" 
              color="error" 
              onClick={handleOpenDeleteDialog}
              startIcon={<DeleteIcon />}
            >
              Delete Account
            </Button>
          </Box>
        </Paper>
      </Box>
      
      {/* Delete Account Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Enter your password to confirm"
            type="password"
            fullWidth
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteAccount} color="error">
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({...snackbar, open: false})}
      >
        <Alert 
          onClose={() => setSnackbar({...snackbar, open: false})} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Profile;