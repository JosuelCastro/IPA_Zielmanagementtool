// src/components/profile/EmailNotificationsToggle.jsx
import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Switch,
    FormControlLabel,
    Paper,
    Alert,
    CircularProgress
} from '@mui/material';
import { NotificationsActive as NotificationIcon } from '@mui/icons-material';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';

const EmailNotificationsToggle = () => {
    const [enabled, setEnabled] = useState(true);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { currentUser } = useAuth();

    // Initialize Firebase Functions
    const functions = getFunctions();
    const updateEmailPreference = httpsCallable(functions, 'updateEmailPreference');

    useEffect(() => {
        const fetchPreference = async () => {
            try {
                if (!currentUser) return;

                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));

                if (userDoc.exists()) {
                    // If emailNotifications is explicitly set to false, disable it
                    // Otherwise, default to enabled
                    setEnabled(userDoc.data().emailNotifications !== false);
                }
            } catch (err) {
                console.error('Error fetching email notification preference:', err);
                setError('Failed to load email notification preference');
            } finally {
                setLoading(false);
            }
        };

        fetchPreference();
    }, [currentUser]);

    const handleToggle = async (event) => {
        const newValue = event.target.checked;
        setUpdating(true);
        setError('');
        setSuccess('');

        try {
            // Update using Firebase Function
            await updateEmailPreference({ enableEmails: newValue });

            // Also update locally for immediate UI feedback
            await updateDoc(doc(db, 'users', currentUser.uid), {
                emailNotifications: newValue
            });

            setEnabled(newValue);
            setSuccess(`Email notifications ${newValue ? 'enabled' : 'disabled'}`);

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error updating email notification preference:', err);
            setError('Failed to update email notification preference');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    return (
        <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationIcon sx={{ fontSize: 24, mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Email Notifications</Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                    Receive email notifications when you get new activity in ZielManager
                </Typography>

                <FormControlLabel
                    control={
                        <Switch
                            checked={enabled}
                            onChange={handleToggle}
                            disabled={updating}
                            color="primary"
                        />
                    }
                    label={updating ? <CircularProgress size={16} /> : enabled ? "On" : "Off"}
                    labelPlacement="start"
                />

            </Box>
        </Paper>
    );
};

export default EmailNotificationsToggle;