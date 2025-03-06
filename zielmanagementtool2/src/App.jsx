import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Box } from '@mui/material';

import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import Header from './components/layout/Header';

// Auth Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerificationSentPage from './pages/VerificationSentPage';

// Dashboard
import Dashboard from './components/dashboard/Dashboard';

// Profile
import ProfilePage from './pages/ProfilePage';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <CssBaseline />
                <AuthProvider>
                    <Router>
                        <Header />
                        <Container maxWidth="lg">
                            <Box sx={{ py: 4 }}>
                                <Routes>
                                    {/* Public Routes */}
                                    <Route path="/login" element={<LoginPage />} />
                                    <Route path="/register" element={<RegisterPage />} />
                                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                                    <Route path="/verification-sent" element={<VerificationSentPage />} />

                                    {/* Protected Routes */}
                                    <Route
                                        path="/dashboard"
                                        element={
                                            <PrivateRoute>
                                                <Dashboard />
                                            </PrivateRoute>
                                        }
                                    />

                                    {/* Profile */}
                                    <Route
                                        path="/profile"
                                        element={
                                            <PrivateRoute>
                                                <ProfilePage />
                                            </PrivateRoute>
                                        }
                                    />

                                    {/* Default Route */}
                                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                </Routes>
                            </Box>
                        </Container>
                    </Router>
                </AuthProvider>
            </LocalizationProvider>
        </ThemeProvider>
    );
}

export default App;