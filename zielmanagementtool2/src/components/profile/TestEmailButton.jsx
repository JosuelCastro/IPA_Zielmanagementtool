// src/components/profile/TestEmailButton.jsx
import { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Alert,
    CircularProgress
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { sendTestEmail } from '../../services/emailService';
import { useAuth } from '../../context/AuthContext';

const TestEmailButton = () => {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { currentUser, userProfile } = useAuth();

    // Only show this component for supervisors
    if (userProfile?.role !== 'supervisor') {
        return null;
    }

    const handleOpen = () => {
        setOpen(true);
        setEmail(currentUser?.email || '');
        setError('');
        setSuccess('');
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSendTest = async () => {
        if (!email.trim()) {
            setError('Email is required');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const result = await sendTestEmail(email);

            if (result.success) {
                setSuccess(`Test email sent to ${email}. Please check your inbox.`);
                // Close the dialog after 3 seconds
                setTimeout(() => setOpen(false), 3000);
            } else {
                setError(result.error || 'Failed to send test email');
            }
        } catch (err) {
            console.error('Error sending test email:', err);
            setError('Failed to send test email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button
                variant="outlined"
                color="primary"
                startIcon={<SendIcon />}
                onClick={handleOpen}
                sx={{ mt: 2 }}
            >
                Test Email Notifications
            </Button>

            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Send Test Email</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Send a test email to verify the notification system is working properly.
                    </DialogContentText>

                    {error && (
                        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
                            {success}
                        </Alert>
                    )}

                    <TextField
                        autoFocus
                        margin="dense"
                        label="Email Address"
                        type="email"
                        fullWidth
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSendTest}
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                    >
                        {loading ? 'Sending...' : 'Send Test'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default TestEmailButton;