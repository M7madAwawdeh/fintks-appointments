import React from 'react';
import { Container, Typography, Box, Button, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(248,250,252,1) 0%, rgba(241,245,249,1) 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
          }}
        >
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 800,
              mb: 4,
            }}
          >
            Welcome to Fintks Appointments
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            paragraph
            sx={{
              mb: 6,
            }}
          >
            Start managing your appointments with our easy-to-use scheduling system.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/appointments')}
            sx={{
              px: 6,
              py: 2,
              fontSize: '1.2rem',
              borderRadius: 2,
              textTransform: 'none',
            }}
          >
            Get Started
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default Home;
