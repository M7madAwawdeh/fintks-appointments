import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Person as PersonIcon,
  Event as EventIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleClose();
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/');
  };

  const menuItems = [
    { text: 'Home', path: '/', icon: null },
    { text: 'Appointments', path: '/appointments', icon: <EventIcon /> },
    user?.role === 'admin' && { text: 'Admin Panel', path: '/admin', icon: <AdminIcon /> },
    user?.role === 'employee' && { text: 'Employee Dashboard', path: '/employee-dashboard', icon: <EventIcon /> },
  ].filter(Boolean);

  const drawer = (
    <Box 
      sx={{ 
        width: 280,
        height: '100%',
        background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)',
      }} 
      role="presentation"
    >
      {user && (
        <Box 
          sx={{ 
            p: 3, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            borderBottom: '1px solid rgba(0,0,0,0.05)',
            mb: 2,
          }}
        >
          <Avatar 
            sx={{ 
              bgcolor: 'transparent',
              background: 'linear-gradient(45deg, #2563eb 30%, #db2777 90%)',
              width: 48,
              height: 48,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              border: '2px solid white',
            }}
          >
            {user.name?.[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>{user.name}</Typography>
            <Typography variant="body2" color="text.secondary">{user.email}</Typography>
          </Box>
        </Box>
      )}
      <List sx={{ px: 1 }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(37, 99, 235, 0.08)',
                transform: 'translateX(5px)',
              },
            }}
          >
            {item.icon && (
              <ListItemIcon 
                sx={{ 
                  color: theme.palette.primary.main,
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
            )}
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{ fontWeight: 500 }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          color: theme.palette.text.primary,
          transition: 'all 0.3s ease-in-out',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #2563eb 0%, #db2777 100%)',
            zIndex: 1,
          },
        }}
      >
        <Toolbar sx={{ py: { xs: 1, md: 1.5 } }}>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.1)' } 
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              flexGrow: 1, 
              cursor: 'pointer',
              fontWeight: 700,
              background: 'linear-gradient(45deg, #2563eb 30%, #db2777 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
              fontSize: { xs: '1.2rem', md: '1.5rem' },
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'translateY(-2px)' }
            }}
            onClick={() => navigate('/')}
          >
            Fintks Appointments
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  onClick={() => handleNavigation(item.path)}
                  startIcon={item.icon}
                  sx={{
                    position: 'relative',
                    fontWeight: 500,
                    px: 2,
                    py: 1,
                    borderRadius: '8px',
                    transition: 'all 0.2s ease-in-out',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '0%',
                      height: '2px',
                      background: 'linear-gradient(45deg, #2563eb 30%, #db2777 90%)',
                      transition: 'width 0.3s ease',
                      borderRadius: '2px',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      transform: 'translateY(-2px)',
                      '&::before': {
                        width: '80%',
                      },
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}

          {user ? (
            <Box sx={{ ml: 2 }}>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
                sx={{
                  transition: 'transform 0.2s ease',
                  '&:hover': { transform: 'scale(1.05)' },
                }}
              >
                <Avatar 
                  sx={{ 
                    width: 38, 
                    height: 38, 
                    bgcolor: 'transparent',
                    background: 'linear-gradient(45deg, #2563eb 30%, #db2777 90%)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    fontWeight: 600,
                    border: '2px solid white',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {user.name?.[0]?.toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    mt: 1.5,
                    overflow: 'visible',
                    borderRadius: 2,
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                }}
              >
                <MenuItem onClick={() => handleNavigation('/profile')}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="inherit" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button color="inherit" onClick={() => navigate('/register')}>
                Register
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}

export default Navbar;