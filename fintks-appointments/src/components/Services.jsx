import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Skeleton,
  Fade,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { AccessTime, AttachMoney, ArrowForward } from '@mui/icons-material';

function Services() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/services`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch services');
      setServices(data);
      setError('');
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Unable to load services. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Skeleton loader for services
  const ServiceSkeleton = () => (
    <Grid item xs={12} sm={6} md={4}>
      <Card sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 3,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      }}>
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          <Skeleton variant="text" width="70%" height={32} sx={{ mb: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Skeleton variant="circular" width={20} height={20} sx={{ mr: 1 }} />
            <Skeleton variant="text" width="40%" height={24} />
          </Box>
          <Skeleton variant="rectangular" height={80} sx={{ mb: 2, borderRadius: 1 }} />
          <Skeleton variant="text" width="30%" height={32} />
        </CardContent>
        <CardActions sx={{ p: 2, pt: 0 }}>
          <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
        </CardActions>
      </Card>
    </Grid>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        Our Services
      </Typography>
      {loading ? (
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <ServiceSkeleton key={index} />
          ))}
        </Grid>
      ) : error ? (
        <Typography variant="body1" color="error">
          {error}
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {services.map((service) => (
            <Grid item xs={12} sm={6} md={4} key={service.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                },
              }}>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
                    {service.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AccessTime sx={{ mr: 1 }} />
                    <Typography variant="body2">{service.duration} mins</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {service.description}
                  </Typography>
                  <Chip label={`$${service.price}`} color="primary" />
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button size="small" color="primary" endIcon={<ArrowForward />}>
                    Learn More
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

export default Services;