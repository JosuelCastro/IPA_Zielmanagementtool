import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    Button,
    Alert,
    CircularProgress
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import EmailIcon from '@mui/icons-material/Email';

const EmailVerificationCheck = ({ children }) => {
    const { currentUser, isEmailVerified, resendVerificationEmail, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleResendEmail = async () => {
        try {
            setLoading(true);
            setMessage('');
            setError('');
            await resendVerificationEmail();
            setMessage('Verification email sent. Please check your inbox.');
        } catch (err) {
            setError('Failed to resend verification email.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (err) {
            console.error('Failed to log out', err);
        }
    };

    // If user is verified or there's no user, don't show the verification screen
    if (!currentUser || isEmailVerified) {
        return children;
    }

    // Otherwise, show verification required screen
    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 3
        }}>
            <Paper elevation={3} sx={{ p: 4, maxWidth: 500, width: '100%', textAlign: 'center' }}>
                <EmailIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />

                <Typography variant="h5" gutterBottom>
                    Email Verification Required
                </Typography>

                <Typography variant="body1" paragraph>
                    We've sent a verification email to <strong>{currentUser.email}</strong>.
                    Please check your email and click the verification link to activate your account.
                </Typography>

                <Typography variant="body2" paragraph color="text.secondary">
                    If you don't see the email, check your spam folder or request a new verification link.
                </Typography>

                {message && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {message}
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                        variant="contained"
                        onClick={handleResendEmail}
                        disabled={loading}
                        fullWidth
                    >
                        {loading ? <CircularProgress size={24} /> : 'Resend Verification Email'}
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={handleLogout}
                        fullWidth
                    >
                        Logout
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default EmailVerificationCheck;