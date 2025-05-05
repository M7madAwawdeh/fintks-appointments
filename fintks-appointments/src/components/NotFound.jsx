import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function NotFound() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        delay: 0.2,
        when: 'beforeChildren',
        staggerChildren: 0.1
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

  return (
    <Container maxWidth="md">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
            py: 8
          }}
        >
          <Paper 
            elevation={3} 
            sx={{ 
              p: 5, 
              borderRadius: 2,
              maxWidth: 500,
              width: '100%',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
            }}
          >
            <motion.div variants={itemVariants}>
              <Typography 
                variant="h1" 
                component="h1" 
                sx={{ 
                  fontSize: '6rem', 
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #2563eb 30%, #db2777 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2
                }}
              >
                404
              </Typography>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Typography variant="h4" component="h2" gutterBottom>
                Page Not Found
              </Typography>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Typography variant="body1" color="text.secondary" paragraph>
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
              </Typography>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Button 
                component={Link} 
                to="/" 
                variant="contained" 
                color="primary"
                size="large"
                sx={{ mt: 2 }}
              >
                Back to Home
              </Button>
            </motion.div>
          </Paper>
        </Box>
      </motion.div>
    </Container>
  );
}

export default NotFound;