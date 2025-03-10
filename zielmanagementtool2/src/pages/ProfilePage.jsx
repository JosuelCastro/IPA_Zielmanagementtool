// src/pages/ProfilePage.jsx
import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    TextField,
    Avatar,
    Divider,
    Alert, Grid2,
    Card,
    CardContent
} from '@mui/material';
import { AdminPanelSettings as SupervisorIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { createSupervisorRequestNotification } from '../services/notificationService';
import EmailNotificationsToggle from '../components/profile/EmailNotificationsToggle';
import TestEmailButton from '../components/profile/TestEmailButton';

const ProfilePage = () => {
    const { currentUser, userProfile } = useAuth();
    const [firstName, setFirstName] = useState(userProfile?.firstName || '');
    const [lastName, setLastName] = useState(userProfile?.lastName || '');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [requestStatus, setRequestStatus] = useState('');
    const [requestLoading, setRequestLoading] = useState(false);
    const [hasSupervisors, setHasSupervisors] = useState(true);

    // Check if there are any supervisors in the system
    useEffect(() => {
        const checkSupervisors = async () => {
            try {
                const supervisorsQuery = query(
                    collection(db, 'users'),
                    where('role', '==', 'supervisor')
                );

                const snapshot = await getDocs(supervisorsQuery);
                setHasSupervisors(snapshot.size > 0);
            } catch (err) {
                console.error('Error checking supervisors:', err);
                // Default to assuming there are supervisors
                setHasSupervisors(true);
            }
        };

        checkSupervisors();
    }, []);

    // Check if user has an existing supervisor request
    useEffect(() => {
        const checkRequestStatus = async () => {
            if (!currentUser) return;

            try {
                // Check if user has a pending supervisor request field in their profile
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists() && userDoc.data().supervisorRequestStatus) {
                    setRequestStatus(userDoc.data().supervisorRequestStatus);
                }
            } catch (err) {
                console.error('Error checking request status:', err);
            }
        };

        checkRequestStatus();
    }, [currentUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!firstName.trim() || !lastName.trim()) {
            setError('First name and last name are required');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                firstName,
                lastName
            });

            setSuccess(true);
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSupervisorRequest = async () => {
        setRequestLoading(true);
        try {
            // Update user's profile to indicate pending request
            await updateDoc(doc(db, 'users', currentUser.uid), {
                supervisorRequestStatus: 'pending',
                supervisorRequestDate: new Date()
            });

            // Create notifications for all supervisors
            await createSupervisorRequestNotification({
                requesterId: currentUser.uid,
                requesterName: `${firstName} ${lastName}`,
                requesterEmail: currentUser.email
            });

            setRequestStatus('pending');
        } catch (err) {
            console.error('Error requesting supervisor status:', err);
            setError('Failed to submit supervisor request. Please try again.');
        } finally {
            setRequestLoading(false);
        }
    };

    const renderSupervisorSection = () => {
        // If user is already a supervisor, show status
        if (userProfile?.role === 'supervisor') {
            return (
                <Card sx={{ bgcolor: 'success.light', color: 'success.dark', mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <SupervisorIcon sx={{ fontSize: 28, mr: 1 }} />
                            <Typography variant="h6">
                                You have Supervisor privileges
                            </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            You can review apprentice goals, approve them, and manage notifications.
                        </Typography>
                    </CardContent>
                </Card>
            );
        }

        // If there are no supervisors in the system, show special message
        if (!hasSupervisors) {
            return (
                <Card sx={{ bgcolor: 'info.light', color: 'info.dark', mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <SupervisorIcon sx={{ fontSize: 28, mr: 1 }} />
                            <Typography variant="h6">
                                Become the first Supervisor
                            </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                            There are currently no supervisors in the system. You can become the first supervisor to start reviewing goals.
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={async () => {
                                try {
                                    await updateDoc(doc(db, 'users', currentUser.uid), {
                                        role: 'supervisor',
                                        roleUpdatedAt: new Date()
                                    });
                                    // Reload the page to reflect the role change
                                    window.location.reload();
                                } catch (err) {
                                    console.error('Error setting supervisor role:', err);
                                    setError('Failed to set supervisor role. Please try again.');
                                }
                            }}
                        >
                            Become Supervisor
                        </Button>
                    </CardContent>
                </Card>
            );
        }

        // Handle different request statuses
        switch (requestStatus) {
            case 'pending':
                return (
                    <Card sx={{ bgcolor: 'info.light', color: 'info.dark', mb: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <SupervisorIcon sx={{ fontSize: 28, mr: 1 }} />
                                <Typography variant="h6">
                                    Supervisor Request Pending
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Your request for supervisor access is currently under review. You'll be notified when it's processed.
                            </Typography>
                        </CardContent>
                    </Card>
                );
            case 'denied':
                return (
                    <Card sx={{ bgcolor: 'error.light', color: 'error.dark', mb: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <SupervisorIcon sx={{ fontSize: 28, mr: 1 }} />
                                <Typography variant="h6">
                                    Supervisor Request Denied
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                                Your previous request for supervisor access was denied. You can submit a new request if needed.
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={handleSupervisorRequest}
                                disabled={requestLoading}
                            >
                                {requestLoading ? 'Submitting...' : 'Request Supervisor Access Again'}
                            </Button>
                        </CardContent>
                    </Card>
                );
            default:
                return (
                    <Card sx={{ bgcolor: 'grey.100', mb: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <SupervisorIcon sx={{ fontSize: 28, mr: 1 }} />
                                <Typography variant="h6">
                                    Request Supervisor Access
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                                Supervisors can review and approve apprentice goals. Request supervisor access if you need these permissions.
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSupervisorRequest}
                                disabled={requestLoading}
                            >
                                {requestLoading ? 'Submitting...' : 'Request Supervisor Access'}
                            </Button>
                        </CardContent>
                    </Card>
                );
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Your Profile
            </Typography>

            {renderSupervisorSection()}

            {/* Email Notifications Toggle */}
            <EmailNotificationsToggle />
            {userProfile?.role === 'supervisor' && (
                <TestEmailButton />
            )}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar
                        sx={{
                            width: 80,
                            height: 80,
                            fontSize: 32,
                            bgcolor: 'primary.main',
                            mr: 3
                        }}
                    >
                        {userProfile?.firstName?.charAt(0) || ''}
                        {userProfile?.lastName?.charAt(0) || ''}
                    </Avatar>
                    <Box>
                        <Typography variant="h5">
                            {userProfile?.firstName} {userProfile?.lastName}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {userProfile?.role === 'supervisor' ? 'Supervisor' : 'Apprentice'}
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {success && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        Profile updated successfully
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    <Grid2 container spacing={2}>
                        <Grid2 item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="First Name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                        </Grid2>
                        <Grid2 item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Last Name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                        </Grid2>
                        <Grid2 item xs={12}>
                            <TextField
                                fullWidth
                                label="Email"
                                value={currentUser?.email || ''}
                                disabled
                            />
                        </Grid2>
                        <Grid2 item xs={12}>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </Grid2>
                    </Grid2>
                </Box>
            </Paper>
        </Box>
    );
};

export default ProfilePage;