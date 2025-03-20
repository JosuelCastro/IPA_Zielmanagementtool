import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    CircularProgress,
    Alert,
    Switch,
    FormControlLabel,
    InputLabel,
    Grid,
    IconButton,
    Collapse,
    Grid2,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { ExpandMore, ExpandLess, Refresh as RefreshIcon } from '@mui/icons-material';

const LeaderboardCountdownSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [expanded, setExpanded] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [lastResetDate, setLastResetDate] = useState(null);
    const { currentUser, userProfile } = useAuth();  // Get currentUser as well

    // Form state
    const [enabled, setEnabled] = useState(false);
    const [title, setTitle] = useState('Countdown');
    const [description, setDescription] = useState('');
    const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default to 7 days from now
    const [backgroundColor, setBackgroundColor] = useState('#f0f7ff');
    const [textColor, setTextColor] = useState('#000000');
    const [completionMessage, setCompletionMessage] = useState('Time is up!');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Get settings document
                const settingsDoc = await getDoc(doc(db, 'settings', 'leaderboard'));

                if (settingsDoc.exists()) {
                    const settingsData = settingsDoc.data();

                    // Handle countdown settings
                    if (settingsData.countdown) {
                        const countdownData = settingsData.countdown;

                        setEnabled(true);
                        setTitle(countdownData.title || 'Countdown');
                        setDescription(countdownData.description || '');
                        if (countdownData.endDate) {
                            setEndDate(countdownData.endDate.toDate());
                        }
                        setBackgroundColor(countdownData.backgroundColor || '#f0f7ff');
                        setTextColor(countdownData.textColor || '#000000');
                        setCompletionMessage(countdownData.completionMessage || 'Time is up!');
                    }

                    // Handle leaderboard reset timestamp
                    if (settingsData.leaderboardResetTimestamp) {
                        setLastResetDate(settingsData.leaderboardResetTimestamp.toDate());
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching settings:', err);
                if (err.code === 'permission-denied') {
                    setPermissionDenied(true);
                    setError('Permission denied: You need to update Firestore security rules to allow access to the settings collection.');
                } else {
                    setError('Failed to load settings');
                }
                setLoading(false);
            }
        };

        if (userProfile?.role === 'supervisor') {
            fetchSettings();
        } else {
            setLoading(false);
        }
    }, [userProfile]);

    const handleSave = async () => {
        if (userProfile?.role !== 'supervisor') {
            setError('Only supervisors can change countdown settings');
            return;
        }

        if (!currentUser?.uid) {
            setError('User authentication error. Please try again after logging in.');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const countdownData = enabled ? {
                title,
                description,
                endDate,
                backgroundColor,
                textColor,
                completionMessage,
                updatedAt: serverTimestamp(),
                updatedBy: currentUser.uid
            } : null;

            await setDoc(doc(db, 'settings', 'leaderboard'), {
                countdown: countdownData,
                updatedAt: serverTimestamp()
            }, { merge: true });

            setSuccess('Countdown settings saved successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error saving countdown settings:', err);
            if (err.code === 'permission-denied') {
                setError('Permission denied: Update your Firestore security rules to allow supervisors to write to the settings collection.');
            } else {
                setError(`Failed to save countdown settings: ${err.message}`);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleResetLeaderboard = async () => {
        if (userProfile?.role !== 'supervisor') {
            setError('Only supervisors can reset the leaderboard');
            return;
        }

        if (!currentUser?.uid) {
            setError('User authentication error. Please try again after logging in.');
            return;
        }

        setResetting(true);
        setError('');
        setSuccess('');

        try {
            // Set a new leaderboard reset timestamp
            await setDoc(doc(db, 'settings', 'leaderboard'), {
                leaderboardResetTimestamp: serverTimestamp(),
                updatedAt: serverTimestamp(),
                updatedBy: currentUser.uid
            }, { merge: true });

            setLastResetDate(new Date());
            setSuccess('Leaderboard has been reset successfully!');
            setTimeout(() => setSuccess(''), 3000);
            setResetDialogOpen(false);
        } catch (err) {
            console.error('Error resetting leaderboard:', err);
            if (err.code === 'permission-denied') {
                setError('Permission denied: Update your Firestore security rules to allow supervisors to write to the settings collection.');
            } else {
                setError(`Failed to reset leaderboard: ${err.message}`);
            }
        } finally {
            setResetting(false);
        }
    };

    const toggleExpand = () => {
        setExpanded(!expanded);
    };

    const formatDate = (date) => {
        if (!date) return 'Never';
        return new Intl.DateTimeFormat('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    // Only supervisors can access this component
    if (userProfile?.role !== 'supervisor') {
        return null;
    }

    if (permissionDenied) {
        return (
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>Countdown Settings</Typography>
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        To fix this issue, update your Firestore security rules to include:
                    </Typography>
                    <pre style={{ backgroundColor: '#f5f5f5', padding: '8px', marginTop: '8px', overflowX: 'auto' }}>
                        {`match /settings/{document} {
  allow read: if true;
  allow write: if request.auth != null && 
                 get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'supervisor';
}`}
                    </pre>
                </Alert>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Leaderboard Settings</Typography>
                <IconButton onClick={toggleExpand}>
                    {expanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
            </Box>

            <Collapse in={expanded}>
                <Grid2 container spacing={3}>
                    {/* Leaderboard Reset Section */}
                    <Grid2 item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Leaderboard Reset
                            </Typography>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Resetting the leaderboard will start a new rating period. Only ratings from goals approved after the reset date will be counted on the leaderboard.
                            </Typography>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2">
                                    Last reset: <strong>{formatDate(lastResetDate)}</strong>
                                </Typography>
                            </Box>

                            <Button
                                variant="contained"
                                color="warning"
                                startIcon={<RefreshIcon />}
                                onClick={() => setResetDialogOpen(true)}
                                disabled={resetting}
                            >
                                Reset Year Ratings
                            </Button>
                        </Paper>
                    </Grid2>

                    <Grid2 item xs={12}>
                        <Divider />
                    </Grid2>

                    {/* Countdown Settings Section */}
                    <Grid2 item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>
                            Countdown Settings
                        </Typography>

                        <Box component="form" noValidate autoComplete="off">
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={enabled}
                                        onChange={(e) => setEnabled(e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="Enable Countdown"
                                sx={{ mb: 2 }}
                            />

                            {enabled && (
                                <Grid2 container spacing={2}>
                                    <Grid2 item xs={12} sm={6}>
                                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                                            <Box sx={{ mt: 2 }}>
                                                <InputLabel htmlFor="end-date">End Date & Time</InputLabel>
                                                <DateTimePicker
                                                    value={endDate}
                                                    onChange={(newValue) => setEndDate(newValue)}
                                                    sx={{ width: '100%' }}
                                                />
                                            </Box>
                                        </LocalizationProvider>
                                    </Grid2>
                                    <Grid2 item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            margin="normal"
                                            label="Title"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />
                                    </Grid2>
                                    <Grid2 item xs={12}>
                                        <TextField
                                            fullWidth
                                            margin="normal"
                                            label="Description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            multiline
                                            rows={2}
                                        />
                                    </Grid2>
                                    <Grid2 item xs={12}>
                                        <TextField
                                            fullWidth
                                            margin="normal"
                                            label="Completion Message"
                                            value={completionMessage}
                                            onChange={(e) => setCompletionMessage(e.target.value)}
                                        />
                                    </Grid2>
                                </Grid2>
                            )}

                            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    variant="contained"
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save Settings'}
                                </Button>
                            </Box>
                        </Box>
                    </Grid2>
                </Grid2>

                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
            </Collapse>

            {/* Reset Confirmation Dialog */}
            <Dialog
                open={resetDialogOpen}
                onClose={() => setResetDialogOpen(false)}
            >
                <DialogTitle>Reset Leaderboard</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        You will start a new Leaderboard and all current ratings will be lost. They'll only be viewable in the individual goals.
                    </DialogContentText>
                    <DialogContentText sx={{ mt: 2, fontWeight: 'bold', color: 'error.main' }}>
                        This action cannot be undone!
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResetDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleResetLeaderboard}
                        color="warning"
                        variant="contained"
                        disabled={resetting}
                    >
                        {resetting ? 'Resetting...' : 'Reset Leaderboard'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default LeaderboardCountdownSettings;