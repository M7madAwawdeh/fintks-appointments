import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Snackbar } from '@mui/material';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Check token validity on initial load
  useEffect(() => {
    const validateStoredToken = () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      
      try {
        const userData = JSON.parse(storedUser);
        if (!userData.token) {
          localStorage.removeItem('user');
          setUser(null);
          return;
        }
        
        // Check token expiration
        const tokenParts = userData.token.split('.');
        if (tokenParts.length !== 3) {
          localStorage.removeItem('user');
          setUser(null);
          return;
        }
        
        try {
          const payload = JSON.parse(atob(tokenParts[1]));
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            localStorage.removeItem('user');
            setUser(null);
            setError('Your session has expired. Please log in again.');
            return;
          }
          
          // Token is valid, set user
          setUser(userData);
        } catch (e) {
          console.error('Error parsing token:', e);
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('user');
        setUser(null);
      }
    };
    
    validateStoredToken();
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        const errorMessage = data.error || 'Login failed';
        setError(errorMessage);
        setLoading(false);
        return { success: false, error: errorMessage };
      }

      const userData = { ...data, token: data.token };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setLoading(false);
      if (userData.role === 'admin') {
        navigate('/admin');
      } else if (userData.role === 'employee') {
        navigate('/employee-dashboard');
      } else {
        navigate('/appointments');
      }
      return { success: true };
    } catch (error) {
      setError(error.message || 'An unexpected error occurred');
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        const errorMessage = data.error || 'Registration failed';
        setError(errorMessage);
        setLoading(false);
        return { success: false, error: errorMessage };
      }

      const userData = { ...data, token: data.token };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setLoading(false);
      if (userData.role === 'admin') {
        navigate('/admin');
      } else if (userData.role === 'employee') {
        navigate('/employee-dashboard');
      } else {
        navigate('/appointments');
      }
      return { success: true };
    } catch (error) {
      setError(error.message || 'An unexpected error occurred');
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  // Function to validate token
  const validateToken = () => {
    if (!user || !user.token) return false;
    
    try {
      const tokenParts = user.token.split('.');
      if (tokenParts.length !== 3) return false;
      
      const payload = JSON.parse(atob(tokenParts[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        // Token expired
        localStorage.removeItem('user');
        setUser(null);
        setError('Your session has expired. Please log in again.');
        return false;
      }
      
      return true;
    } catch (e) {
      console.error('Error validating token:', e);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, validateToken }}>
      {children}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </AuthContext.Provider>
  );
};