import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';

function ProtectedRoute({ children, requireAdmin, requireEmployee }) {
  const { user } = useAuth();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      setIsValidating(true);
      
      // Check if user exists and token is valid
      if (user && user.token) {
        try {
          // Check token expiration
          const tokenParts = user.token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload.exp && payload.exp * 1000 > Date.now()) {
              setIsValid(true);
            } else {
              console.error('Token expired');
              setIsValid(false);
            }
          } else {
            console.error('Invalid token format');
            setIsValid(false);
          }
        } catch (error) {
          console.error('Error validating token:', error);
          setIsValid(false);
        }
      } else {
        setIsValid(false);
      }
      
      setIsValidating(false);
    };
    
    checkAuth();
  }, [user]);

  if (isValidating) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '50vh' 
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <CircularProgress size={40} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Verifying your session...
          </Typography>
        </motion.div>
      </Box>
    );
  }

  if (!user || !isValid) {
    // Save the location they were trying to access for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (requireEmployee && user.role !== 'employee') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;