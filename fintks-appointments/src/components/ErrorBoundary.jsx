import React, { Component } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { motion } from 'framer-motion';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      // Animation variants
      const containerVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { 
          opacity: 1, 
          scale: 1,
          transition: { 
            type: 'spring',
            stiffness: 100,
            damping: 15
          }
        }
      };

      return (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '50vh',
            p: 3
          }}
        >
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <Paper 
              elevation={3} 
              sx={{ 
                p: 4, 
                maxWidth: 500,
                textAlign: 'center',
                borderRadius: 2,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
              }}
            >
              <Typography variant="h4" component="h2" color="error" gutterBottom>
                Something went wrong
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 3 }}>
                We apologize for the inconvenience. The application encountered an unexpected error.
              </Typography>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box sx={{ mt: 2, mb: 2, textAlign: 'left', bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', color: 'error.main', fontSize: '0.8rem' }}>
                    {this.state.error.toString()}
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={this.handleReset}
                >
                  Try Again
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => window.location.href = '/'}
                >
                  Go to Home
                </Button>
              </Box>
            </Paper>
          </motion.div>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;