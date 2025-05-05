import { Box, Container, Typography, Link, Grid, useTheme, Paper, Divider, IconButton, Tooltip } from '@mui/material';
import { Facebook, Twitter, Instagram, LinkedIn, Email, Phone, LocationOn, ArrowUpward } from '@mui/icons-material';

function Footer() {
  const theme = useTheme();
  
  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <Paper
      component="footer"
      elevation={0}
      square
      sx={{
        py: 6,
        px: 2,
        mt: 'auto',
        background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #2563eb 0%, #db2777 100%)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'radial-gradient(circle at 20% 90%, rgba(255,255,255,0.1) 0%, transparent 20%)',
          zIndex: 0,
        }
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={4}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(45deg, #ffffff 30%, #e0e7ff 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
                display: 'inline-block',
              }}
            >
              Fintks Appointments
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, maxWidth: '90%', lineHeight: 1.7 }}>
              Professional appointment scheduling system for businesses and service providers. Streamline your booking process and enhance customer experience.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
              <IconButton 
                color="inherit" 
                size="small" 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.1)', 
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    transform: 'translateY(-3px)' 
                  } 
                }}
              >
                <Facebook fontSize="small" />
              </IconButton>
              <IconButton 
                color="inherit" 
                size="small" 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.1)', 
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    transform: 'translateY(-3px)' 
                  } 
                }}
              >
                <Twitter fontSize="small" />
              </IconButton>
              <IconButton 
                color="inherit" 
                size="small" 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.1)', 
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    transform: 'translateY(-3px)' 
                  } 
                }}
              >
                <Instagram fontSize="small" />
              </IconButton>
              <IconButton 
                color="inherit" 
                size="small" 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.1)', 
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    transform: 'translateY(-3px)' 
                  } 
                }}
              >
                <LinkedIn fontSize="small" />
              </IconButton>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                fontWeight: 600,
                mb: 2,
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  left: 0,
                  width: 40,
                  height: 2,
                  background: 'linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,0.3) 100%)',
                  borderRadius: 1,
                }
              }}
            >
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Link 
                href="/" 
                color="inherit" 
                underline="none"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    pl: 0.5, 
                    color: 'rgba(255,255,255,0.8)' 
                  } 
                }}
              >
                <Box 
                  component="span" 
                  sx={{ 
                    width: 5, 
                    height: 5, 
                    borderRadius: '50%', 
                    bgcolor: 'rgba(255,255,255,0.5)', 
                    mr: 1.5 
                  }} 
                />
                Home
              </Link>
              <Link 
                href="/appointments" 
                color="inherit" 
                underline="none"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    pl: 0.5, 
                    color: 'rgba(255,255,255,0.8)' 
                  } 
                }}
              >
                <Box 
                  component="span" 
                  sx={{ 
                    width: 5, 
                    height: 5, 
                    borderRadius: '50%', 
                    bgcolor: 'rgba(255,255,255,0.5)', 
                    mr: 1.5 
                  }} 
                />
                Appointments
              </Link>
              <Link 
                href="/services" 
                color="inherit" 
                underline="none"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    pl: 0.5, 
                    color: 'rgba(255,255,255,0.8)' 
                  } 
                }}
              >
                <Box 
                  component="span" 
                  sx={{ 
                    width: 5, 
                    height: 5, 
                    borderRadius: '50%', 
                    bgcolor: 'rgba(255,255,255,0.5)', 
                    mr: 1.5 
                  }} 
                />
                Services
              </Link>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                fontWeight: 600,
                mb: 2,
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  left: 0,
                  width: 40,
                  height: 2,
                  background: 'linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,0.3) 100%)',
                  borderRadius: 1,
                }
              }}
            >
              Contact Us
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 1, borderRadius: 1 }}>
                  <Email fontSize="small" />
                </Box>
                <Typography variant="body2">support@fintks.com</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 1, borderRadius: 1 }}>
                  <Phone fontSize="small" />
                </Box>
                <Typography variant="body2">+1 (555) 123-4567</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 1, borderRadius: 1 }}>
                  <LocationOn fontSize="small" />
                </Box>
                <Typography variant="body2">123 Business Ave, Suite 100<br />New York, NY 10001</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
        <Divider sx={{ mt: 5, mb: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="body2" align="center" sx={{ opacity: 0.8 }}>
            © {new Date().getFullYear()} Fintks Appointments. All rights reserved.
          </Typography>
        </Box>
      </Container>
      
      {/* Scroll to top button */}
      <Tooltip title="Scroll to top" placement="top">
        <IconButton
          onClick={handleScrollToTop}
          sx={{
            position: 'absolute',
            right: 24,
            bottom: 24,
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(4px)',
            color: 'white',
            width: 48,
            height: 48,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              transform: 'translateY(-4px)',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
            },
          }}
        >
          <ArrowUpward />
        </IconButton>
      </Tooltip>
    </Paper>
  );
}

export default Footer;