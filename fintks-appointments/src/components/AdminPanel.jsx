import { useState } from 'react';
import { Container, Box, Typography, Tabs, Tab, Paper, Divider, Alert } from '@mui/material';
import { 
  People as PeopleIcon, 
  Work as WorkIcon, 
  Category as CategoryIcon,
  AdminPanelSettings as AdminIcon,
  Email as EmailIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import ServicePanel from './admin_parts/ServicePanel';
import EmployeePanel from './admin_parts/EmployeePanel';
import UsersPanel from './admin_parts/UsersPanel';
import EmailPanel from './admin_parts/EmailPanel';
import AppointmentsPanel from './admin_parts/AppointmentsPanel';
import { useTheme } from '@mui/material/styles';

function AdminPanel() {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();

  if (!user || user.role !== 'admin') {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              borderRadius: 2,
              textAlign: 'center',
              background: theme.palette.background.paper,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}
          >
            <AdminIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>Access Denied</Typography>
            <Alert severity="error" sx={{ mb: 2 }}>
              You do not have permission to access this page.
            </Alert>
            <Typography variant="body1" color="text.secondary">
              This area is restricted to administrators only. Please contact an administrator if you need access.
            </Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            borderRadius: 2, 
            overflow: 'hidden',
            background: theme.palette.background.paper,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}
        >
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center',
            background: theme.palette.background.gradient,
            borderBottom: '1px solid rgba(0,0,0,0.08)'
          }}>
            <AdminIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700,
                background: theme.palette.primary.gradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Administration Panel
            </Typography>
          </Box>
          
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                py: 2,
                fontWeight: 600,
              },
              '& .Mui-selected': {
                color: theme.palette.primary.main,
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                background: theme.palette.primary.gradient,
              }
            }}
          >
            <Tab icon={<CategoryIcon />} label="Services" iconPosition="start" />
            <Tab icon={<WorkIcon />} label="Employees" iconPosition="start" />
            <Tab icon={<PeopleIcon />} label="Users" iconPosition="start" />
            <Tab icon={<EventIcon />} label="Appointments" iconPosition="start" />
            <Tab icon={<EmailIcon />} label="Emails" iconPosition="start" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {tabValue === 0 && <ServicePanel />}
            {tabValue === 1 && <EmployeePanel />}
            {tabValue === 2 && <UsersPanel />}
            {tabValue === 3 && <AppointmentsPanel />}
            {tabValue === 4 && <EmailPanel />}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default AdminPanel;