import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  LinearProgress,
  InputAdornment,
  IconButton,
  Fade,
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

function Register() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ strength: 0, message: '' });
  
  // Toggle password visibility
  const handleTogglePassword = () => setShowPassword(!showPassword);
  const handleToggleConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);
  
  // Calculate password strength
  useEffect(() => {
    if (!formData.password) {
      setPasswordStrength({ strength: 0, message: '' });
      return;
    }
    
    let strength = 0;
    let message = 'Weak';
    
    // Length check
    if (formData.password.length >= 8) strength += 1;
    
    // Complexity checks
    if (/[A-Z]/.test(formData.password)) strength += 1;
    if (/[0-9]/.test(formData.password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(formData.password)) strength += 1;
    
    // Set message based on strength
    if (strength === 1) message = 'Weak';
    else if (strength === 2) message = 'Fair';
    else if (strength === 3) message = 'Good';
    else if (strength >= 4) message = 'Strong';
    
    setPasswordStrength({ strength: strength, message });
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    // Validate password strength
    if (passwordStrength.strength < 2) {
      setError('Password is too weak. Please include uppercase letters, numbers, or special characters.');
      setLoading(false);
      return;
    }

    try {
      const result = await register(formData.name, formData.email, formData.password);
      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return; // Ensure return here to stop further execution
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      setLoading(false);
      return; // Ensure return here to stop further execution
    }

    // Reset form and navigate to another page if needed
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    setLoading(false);
    // Optionally navigate to another page or show success message
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '4px',
              background: 'linear-gradient(90deg, #2563eb 0%, #db2777 100%)',
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <LockOutlined sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
          </Box>
          <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 700 }}>
            Fintks Appointments
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom align="center" sx={{ mb: 3 }}>
            Create Your Account
          </Typography>
          
          <Fade in={!!error}>
            <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }}>
              {error}
            </Alert>
          </Fade>
          
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
              required
              variant="outlined"
              sx={{ mb: 2 }}
              InputProps={{
                sx: { borderRadius: 1.5 }
              }}
            />
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
              variant="outlined"
              sx={{ mb: 2 }}
              InputProps={{
                sx: { borderRadius: 1.5 }
              }}
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              variant="outlined"
              sx={{ mb: 1 }}
              InputProps={{
                sx: { borderRadius: 1.5 },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            {formData.password && (
              <Box sx={{ mb: 2, px: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Password Strength:
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontWeight: 600,
                      color: passwordStrength.strength <= 1 ? 'error.main' : 
                             passwordStrength.strength === 2 ? 'warning.main' : 
                             passwordStrength.strength === 3 ? 'success.light' : 'success.main'
                    }}
                  >
                    {passwordStrength.message}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={passwordStrength.strength * 25} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    bgcolor: 'rgba(0,0,0,0.05)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: passwordStrength.strength <= 1 ? 'error.main' : 
                              passwordStrength.strength === 2 ? 'warning.main' : 
                              passwordStrength.strength === 3 ? 'success.light' : 'success.main'
                    }
                  }} 
                />
              </Box>
            )}
            
            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              InputProps={{
                sx: { borderRadius: 1.5 },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={handleToggleConfirmPassword}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              onChange={handleChange}
              margin="normal"
              required
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"

              color="primary"
              size="large"
              disabled={loading}
              sx={{ 
                mt: 4, 
                mb: 2,
                py: 1.5,
                position: 'relative',
                borderRadius: 1.5,
                fontWeight: 600,
                fontSize: '1rem',
                background: 'linear-gradient(45deg, #2563eb 30%, #3b82f6 90%)',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)',
                '&:hover': {
                  boxShadow: '0 6px 15px rgba(37, 99, 235, 0.3)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" sx={{ position: 'absolute' }} />
              ) : 'Create Account'}
            </Button>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  style={{ 
                    textDecoration: 'none',
                    color: '#2563eb',
                    fontWeight: 600,
                    transition: 'all 0.2s ease'
                  }}
                >
                  Sign in
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}
export default Register;