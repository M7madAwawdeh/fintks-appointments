import { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  Divider,
  Alert,
  Snackbar,
  Grid,
  Tab,
  Tabs,
  CircularProgress
} from '@mui/material';
import {
  Email as EmailIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

function EmailPanel() {
  const theme = useTheme();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openTestEmailDialog, setOpenTestEmailDialog] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [testEmailForm, setTestEmailForm] = useState({
    to: '',
    subject: '',
    text: '',
    html: ''
  });

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (!storedUser?.token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/emails`, {
        headers: {
          'Authorization': `Bearer ${storedUser.token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch emails');
      }
      setEmails(data.data);
    } catch (error) {
      console.error('Error fetching emails:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load emails: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenTestEmailDialog = () => {
    setOpenTestEmailDialog(true);
  };

  const handleCloseTestEmailDialog = () => {
    setOpenTestEmailDialog(false);
  };

  const handleOpenViewDialog = (email) => {
    setSelectedEmail(email);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
  };

  const handleTestEmailChange = (e) => {
    const { name, value } = e.target;
    setTestEmailForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendTestEmail = async () => {
    try {
      setLoading(true);
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (!storedUser?.token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/emails/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedUser.token}`
        },
        body: JSON.stringify(testEmailForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test email');
      }

      setSnackbar({
        open: true,
        message: 'Test email sent successfully!',
        severity: 'success'
      });

      // Reset form and close dialog
      setTestEmailForm({
        to: '',
        subject: '',
        text: '',
        html: ''
      });
      setOpenTestEmailDialog(false);
      
      // Refresh email list
      fetchEmails();
    } catch (error) {
      console.error('Error sending test email:', error);
      setSnackbar({
        open: true,
        message: 'Failed to send test email: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerificationEmail = async (userId) => {
    try {
      setLoading(true);
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (!storedUser?.token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/emails/verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedUser.token}`
        },
        body: JSON.stringify({ user_id: userId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification email');
      }

      setSnackbar({
        open: true,
        message: 'Verification email sent successfully!',
        severity: 'success'
      });
      
      // Refresh email list
      fetchEmails();
    } catch (error) {
      console.error('Error sending verification email:', error);
      setSnackbar({
        open: true,
        message: 'Failed to send verification email: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendAppointmentEmail = async (appointmentId) => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/emails/appointment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ appointment_id: appointmentId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send appointment email');
      }

      setSnackbar({
        open: true,
        message: 'Appointment email sent successfully!',
        severity: 'success'
      });
      
      // Refresh email list
      fetchEmails();
    } catch (error) {
      console.error('Error sending appointment email:', error);
      setSnackbar({
        open: true,
        message: 'Failed to send appointment email: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmailStatus = async (emailId, status) => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/emails/${emailId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update email status');
      }

      setSnackbar({
        open: true,
        message: 'Email status updated successfully!',
        severity: 'success'
      });
      
      // Refresh email list
      fetchEmails();
    } catch (error) {
      console.error('Error updating email status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update email status: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip size="small" label="Pending" color="warning" />;
      case 'sent':
        return <Chip size="small" label="Sent" color="info" />;
      case 'delivered':
        return <Chip size="small" label="Delivered" color="success" />;
      case 'opened':
        return <Chip size="small" label="Opened" color="success" icon={<CheckCircleIcon />} />;
      case 'failed':
        return <Chip size="small" label="Failed" color="error" />;
      default:
        return <Chip size="small" label={status} />;
    }
  };

  const getTypeChip = (type) => {
    switch (type) {
      case 'verification':
        return <Chip size="small" label="Verification" color="primary" />;
      case 'appointment':
        return <Chip size="small" label="Appointment" color="secondary" />;
      case 'reminder':
        return <Chip size="small" label="Reminder" color="info" />;
      case 'test':
        return <Chip size="small" label="Test" color="default" />;
      default:
        return <Chip size="small" label={type} />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          <EmailIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Email Notifications
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={fetchEmails}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button 
            variant="contained" 
            startIcon={<SendIcon />} 
            onClick={handleOpenTestEmailDialog}
            color="primary"
          >
            Send Email
          </Button>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
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
          <Tab label="All Emails" />
          <Tab label="Appointment Emails" />
          <Tab label="Sent Emails" />
        </Tabs>

        <Box sx={{ p: 0 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && emails.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">No emails found</Typography>
            </Box>
          )}

          {!loading && emails.length > 0 && (
            <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
              {emails
                .filter(email => {
                  if (tabValue === 0) return true;
                  if (tabValue === 1) return email.type === 'appointment';
                  if (tabValue === 2) return email.type === 'test';
                  return true;
                })
                .map((email, index) => (
                  <Box key={email.id}>
                    <ListItem
                      alignItems="flex-start"
                      sx={{ 
                        py: 2,
                        px: 3,
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } 
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <Typography 
                              component="span" 
                              variant="subtitle1"
                              sx={{ fontWeight: 600, mr: 1 }}
                            >
                              {email.email}
                            </Typography>
                            {getTypeChip(email.type)}
                            <Box sx={{ ml: 'auto' }}>
                              {getStatusChip(email.status)}
                            </Box>
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                            >
                              Sent: {formatDate(email.sent_at)}
                            </Typography>
                            {email.updated_at && email.updated_at !== email.sent_at && (
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.secondary"
                                sx={{ ml: 2 }}
                              >
                                Updated: {formatDate(email.updated_at)}
                              </Typography>
                            )}
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleOpenViewDialog(email)}>
                          <VisibilityIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < emails.length - 1 && <Divider />}
                  </Box>
                ))}
            </List>
          )}
        </Box>
      </Paper>

      {/* Test Email Dialog */}
      <Dialog open={openTestEmailDialog} onClose={handleCloseTestEmailDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SendIcon sx={{ mr: 1 }} />
            Send Email
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="to"
                label="To"
                fullWidth
                value={testEmailForm.to}
                onChange={handleTestEmailChange}
                margin="normal"
                variant="outlined"
                placeholder="recipient@example.com"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="subject"
                label="Subject"
                fullWidth
                value={testEmailForm.subject}
                onChange={handleTestEmailChange}
                margin="normal"
                variant="outlined"
                placeholder="Email Subject"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="text"
                label="Plain Text Content"
                fullWidth
                multiline
                rows={4}
                value={testEmailForm.text}
                onChange={handleTestEmailChange}
                margin="normal"
                variant="outlined"
                placeholder="Plain text version of your email"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="html"
                label="HTML Content"
                fullWidth
                multiline
                rows={8}
                value={testEmailForm.html}
                onChange={handleTestEmailChange}
                margin="normal"
                variant="outlined"
                placeholder="<h1>HTML version of your email</h1>"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseTestEmailDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSendTestEmail} 
            variant="contained" 
            color="primary"
            disabled={!testEmailForm.to || !testEmailForm.subject || (!testEmailForm.text && !testEmailForm.html) || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Email Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        {selectedEmail && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EmailIcon sx={{ mr: 1 }} />
                Email Details
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                  <Typography variant="body1">{getTypeChip(selectedEmail.type)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Typography variant="body1">{getStatusChip(selectedEmail.status)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Recipient</Typography>
                  <Typography variant="body1">{selectedEmail.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Sent At</Typography>
                  <Typography variant="body1">{formatDate(selectedEmail.sent_at)}</Typography>
                </Grid>
                {selectedEmail.content && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Content</Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 1, maxHeight: 300, overflow: 'auto' }}>
                      <div dangerouslySetInnerHTML={{ __html: selectedEmail.content }} />
                    </Paper>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">Actions</Typography>
                    <Box sx={{ mt: 1 }}>
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        onClick={() => handleUpdateEmailStatus(selectedEmail.id, 'delivered')}
                        sx={{ mr: 1, mb: 1 }}
                      >
                        Mark as Delivered
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="success" 
                        onClick={() => handleUpdateEmailStatus(selectedEmail.id, 'opened')}
                        sx={{ mr: 1, mb: 1 }}
                      >
                        Mark as Opened
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="error" 
                        onClick={() => handleUpdateEmailStatus(selectedEmail.id, 'failed')}
                        sx={{ mb: 1 }}
                      >
                        Mark as Failed
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={handleCloseViewDialog} color="primary">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default EmailPanel;