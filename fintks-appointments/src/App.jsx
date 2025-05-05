import { Routes, Route } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ThemeProvider, CssBaseline, Box, Container } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { theme } from './theme/theme';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './components/NotFound';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Appointments from './components/Appointments';
import AdminPanel from './components/AdminPanel';
import EmployeeDashboard from './components/EmployeeDashboard';
import Services from './components/Services';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './components/Profile';
import { AnimatePresence, motion } from 'framer-motion';
import './App.css';



function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <CssBaseline />
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh',
            }}
          >
            <Navbar />
            <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
              <Container maxWidth="lg">
                <AnimatePresence mode="wait">
                  <Routes>
                    <Route path="/" element={
                      <motion.div
                        key="home"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Home />
                      </motion.div>
                    } />
                    <Route path="/login" element={
                      <motion.div
                        key="login"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Login />
                      </motion.div>
                    } />
                    <Route path="/register" element={
                      <motion.div
                        key="register"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Register />
                      </motion.div>
                    } />
                    <Route path="/services" element={
                      <motion.div
                        key="services"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Services />
                      </motion.div>
                    } />
                    <Route path="/profile" element={
                      <motion.div
                        key="profile"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Profile />
                      </motion.div>
                    } />
                    <Route
                      path="/appointments"
                      element={
                        <ProtectedRoute>
                          <motion.div
                            key="appointments"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Appointments />
                          </motion.div>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <motion.div
                            key="admin"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <AdminPanel />
                          </motion.div>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/employee-dashboard"
                      element={
                        <ProtectedRoute requireEmployee={true}>
                          <motion.div
                            key="employee-dashboard"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <EmployeeDashboard />
                          </motion.div>
                        </ProtectedRoute>
                      }
                    />
                    {/* 404 Route - Must be last */}
                    <Route path="*" element={
                      <motion.div
                        key="not-found"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <NotFound />
                      </motion.div>
                    } />
                  </Routes>
                </AnimatePresence>
              </Container>
            </Box>
            <Footer />
          </Box>
          </LocalizationProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
