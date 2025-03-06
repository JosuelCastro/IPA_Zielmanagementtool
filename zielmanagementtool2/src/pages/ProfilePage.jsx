import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    TextField,
    Avatar,
    Divider,
    Alert, Grid2
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const ProfilePage = () => {
    const { currentUser, userProfile } = useAuth();
    const [firstName, setFirstName] = useState(userProfile?.firstName || '');
    const [lastName, setLastName] = useState(userProfile?.lastName || '');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

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

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Your Profile
            </Typography>

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