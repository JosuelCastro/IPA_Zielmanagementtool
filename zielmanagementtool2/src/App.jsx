import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Box } from '@mui/material';

import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import EmailVerificationCheck from './components/auth/EmailVerificationCheck';
import Header from './components/layout/Header';

// Auth Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerificationSentPage from './pages/VerificationSentPage';

// Dashboard
import Dashboard from './components/dashboard/Dashboard';

// Apprentice Pages
import GoalList from './components/goals/GoalList';
import GoalDetail from './components/goals/GoalDetail';
import GoalForm from './components/goals/GoalForm';
import GoalEdit from './components/goals/GoalEdit';

// Supervisor Pages
import ApprenticeList from './components/supervisor/ApprenticeList';
import ApprenticeDetail from './components/supervisor/ApprenticeDetail';
import GoalReview from './components/supervisor/GoalReview';

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
                                                <EmailVerificationCheck>
                                                    <Dashboard />
                                                </EmailVerificationCheck>
                                            </PrivateRoute>
                                        }
                                    />

                                    {/* Goal Routes */}
                                    <Route
                                        path="/goals"
                                        element={
                                            <PrivateRoute>
                                                <EmailVerificationCheck>
                                                    <GoalList />
                                                </EmailVerificationCheck>
                                            </PrivateRoute>
                                        }
                                    />
                                    <Route
                                        path="/goals/create"
                                        element={
                                            <PrivateRoute>
                                                <EmailVerificationCheck>
                                                    <GoalForm />
                                                </EmailVerificationCheck>
                                            </PrivateRoute>
                                        }
                                    />
                                    <Route
                                        path="/goals/:goalId"
                                        element={
                                            <PrivateRoute>
                                                <EmailVerificationCheck>
                                                    <GoalDetail />
                                                </EmailVerificationCheck>
                                            </PrivateRoute>
                                        }
                                    />
                                    <Route
                                        path="/goals/:goalId/edit"
                                        element={
                                            <PrivateRoute>
                                                <EmailVerificationCheck>
                                                    <GoalEdit />
                                                </EmailVerificationCheck>
                                            </PrivateRoute>
                                        }
                                    />
                                    <Route
                                        path="/goals/:goalId/review"
                                        element={
                                            <PrivateRoute>
                                                <EmailVerificationCheck>
                                                    <GoalReview />
                                                </EmailVerificationCheck>
                                            </PrivateRoute>
                                        }
                                    />

                                    {/* Supervisor Routes */}
                                    <Route
                                        path="/apprentices"
                                        element={
                                            <PrivateRoute>
                                                <EmailVerificationCheck>
                                                    <ApprenticeList />
                                                </EmailVerificationCheck>
                                            </PrivateRoute>
                                        }
                                    />
                                    <Route
                                        path="/apprentices/:apprenticeId"
                                        element={
                                            <PrivateRoute>
                                                <EmailVerificationCheck>
                                                    <ApprenticeDetail />
                                                </EmailVerificationCheck>
                                            </PrivateRoute>
                                        }
                                    />

                                    {/* Profile */}
                                    <Route
                                        path="/profile"
                                        element={
                                            <PrivateRoute>
                                                <EmailVerificationCheck>
                                                    <ProfilePage />
                                                </EmailVerificationCheck>
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