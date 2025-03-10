import React, { useState } from 'react';
import {
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Typography,
    Box,
    Button,
    Divider,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Check as ApproveIcon,
    Close as DenyIcon,
    AdminPanelSettings as SupervisorIcon
} from '@mui/icons-material';
import { processSupervisorRequest } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const ActionableNotification = ({ notification, onActionComplete }) => {
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [processed, setProcessed] = useState(false); // New state to track if notification has been processed
    const { currentUser, userProfile } = useAuth();

    // Handle an action (approve/deny) on the notification
    const handleAction = async (action) => {
        setProcessing(true);
        setError(null);

        try {
            console.log("Processing action:", action);

            // Process the supervisor request
            const result = await processSupervisorRequest({
                notificationId: notification.id,
                requesterId: notification.senderId,
                action,
                processedBy: currentUser.uid,
                processorName: `${userProfile.firstName} ${userProfile.lastName}`
            });

            console.log("Process result:", result);

            if (!result.success) {
                throw new Error(result.error || "Failed to process request");
            }

            // Mark as processed locally
            setProcessed(true);

            // Call the callback to remove this notification from the UI
            if (onActionComplete) {
                onActionComplete(notification.id, action, true); // Pass true to indicate deletion
            }
        } catch (err) {
            console.error('Error processing action:', err);
            setError(err.message || 'Failed to process request. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    // If notification has been processed locally, don't render anything
    if (processed) {
        return null;
    }

    return (
        <>
            <ListItem
                sx={{
                    p: 2,
                    display: 'block' // Full width for the action buttons
                }}
            >
                <Box sx={{ display: 'flex', mb: 2 }}>
                    <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                            <SupervisorIcon />
                        </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                        primary={
                            <Typography variant="body2" component="span" fontWeight="bold">
                                {notification.message}
                            </Typography>
                        }
                        secondary={
                            <Box sx={{ mt: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                    {notification.createdAt ? formatDistanceToNow(notification.createdAt, { addSuffix: true }) : ''}
                                </Typography>
                            </Box>
                        }
                    />
                </Box>

                {/* Action buttons */}
                <Box sx={{ ml: 9, display: 'flex', gap: 2 }}>
                    {processing ? (
                        <CircularProgress size={24} />
                    ) : (
                        <>
                            <Button
                                variant="contained"
                                color="success"
                                size="small"
                                startIcon={<ApproveIcon />}
                                onClick={() => handleAction('approve')}
                            >
                                Approve
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<DenyIcon />}
                                onClick={() => handleAction('deny')}
                            >
                                Deny
                            </Button>
                        </>
                    )}
                </Box>

                {error && (
                    <Box sx={{ ml: 9, mt: 1 }}>
                        <Alert severity="error">{error}</Alert>
                    </Box>
                )}
            </ListItem>
            <Divider component="li" />
        </>
    );
};

export default ActionableNotification;