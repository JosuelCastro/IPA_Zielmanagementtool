import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Popover,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    ListItemSecondaryAction,
    Avatar,
    Typography,
    IconButton,
    Divider,
    Box,
    Button,
    CircularProgress,
    Chip,
    Tabs,
    Tab
} from '@mui/material';
import {
    Comment as CommentIcon,
    Star as StarIcon,
    CheckCircle as CheckCircleIcon,
    ClearAll as ClearAllIcon,
    MarkChatRead as MarkReadIcon,
    AssignmentTurnedIn,
    AddTask as AddTaskIcon,
    AdminPanelSettings as SupervisorIcon,
    Celebration as CelebrationIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs, orderBy, limit, updateDoc, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import ActionableNotification from './ActionableNotification';

const NotificationsPopup = ({ anchorEl, open, onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [indexError, setIndexError] = useState(false);
    const [indexUrl, setIndexUrl] = useState('');
    const [activeTab, setActiveTab] = useState(0);
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();

    // Get all notifications sorted by read status and date
    useEffect(() => {
        if (!open || !currentUser) return;

        const fetchNotifications = async () => {
            setLoading(true);
            setError(null);
            setIndexError(false);

            try {
                // First, try to query with ordering by createdAt (requires index)
                let notificationQuery;
                try {
                    notificationQuery = query(
                        collection(db, 'notifications'),
                        where('recipientId', '==', currentUser.uid),
                        orderBy('createdAt', 'desc'),
                        limit(50)
                    );
                } catch (e) {
                    // If we get an error here, fall back to a simpler query
                    console.error("Error creating query:", e);
                    notificationQuery = query(
                        collection(db, 'notifications'),
                        where('recipientId', '==', currentUser.uid)
                    );
                }

                try {
                    const querySnapshot = await getDocs(notificationQuery);
                    const notificationList = [];
                    querySnapshot.forEach((doc) => {
                        notificationList.push({
                            id: doc.id,
                            ...doc.data(),
                            createdAt: doc.data().createdAt?.toDate()
                        });
                    });

                    // Sort manually if we couldn't use orderBy in the query
                    if (!notificationQuery._query.orderBy) {
                        notificationList.sort((a, b) => {
                            if (!a.createdAt) return 1;
                            if (!b.createdAt) return -1;
                            return b.createdAt - a.createdAt;
                        });
                    }

                    setNotifications(notificationList);
                } catch (err) {
                    console.error('Error fetching notifications:', err);

                    // Check if this is an index error
                    if (err.code === 'failed-precondition' && err.message.includes('index')) {
                        setIndexError(true);
                        // Extract the URL from the error message
                        const urlMatch = err.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
                        if (urlMatch) {
                            setIndexUrl(urlMatch[0]);
                        }
                    } else {
                        setError('Error loading notifications. Please try again later.');
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [open, currentUser]);

    // Handle notification click - mark as read and navigate if needed
    const handleNotificationClick = async (notification) => {
        try {
            // Mark notification as read
            if (!notification.read) {
                await updateDoc(doc(db, 'notifications', notification.id), {
                    read: true
                });
            }

            // Close the popup
            onClose();

            // Handle different navigation based on notification type
            if (notification.type === 'goal_reminder') {
                // For goal reminders, go to goal creation page
                navigate('/goals/create');
            } else if (notification.type === 'supervisor_request_result') {
                // For supervisor request results, go to profile page
                navigate('/profile');
            } else if (notification.goalId) {
                // For goal-related notifications
                if (notification.recipientRole === 'supervisor') {
                    navigate(`/goals/${notification.goalId}/review`);
                } else {
                    navigate(`/goals/${notification.goalId}`);
                }
            }
        } catch (error) {
            console.error('Error handling notification click:', error);
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            const batch = writeBatch(db);
            const unreadNotifications = notifications.filter(n => !n.read);

            unreadNotifications.forEach(notification => {
                const notificationRef = doc(db, 'notifications', notification.id);
                batch.update(notificationRef, { read: true });
            });

            await batch.commit();

            // Update local state
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    // Handle the completion of an action on a notification
    const handleActionComplete = (notificationId, action, deleted = false) => {
        if (deleted) {
            // Remove the notification from the list if it was deleted
            setNotifications(notifications.filter(notification =>
                notification.id !== notificationId
            ));
        } else {
            // Otherwise, just update its status
            setNotifications(notifications.map(notification =>
                notification.id === notificationId
                    ? {
                        ...notification,
                        read: true,
                        additionalData: {
                            ...notification.additionalData,
                            requestStatus: action,
                            processedAt: new Date()
                        }
                    }
                    : notification
            ));
        }
    };

    // Get notification icon based on type
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'comment':
                return <CommentIcon />;
            case 'approval':
                return <CheckCircleIcon color="success" />;
            case 'submission':
                return <AssignmentTurnedIn color="primary" />;
            case 'rating':
                return <StarIcon color="primary" />;
            case 'goal_reminder':
                return <AddTaskIcon color="warning" />;
            case 'supervisor_request':
                return <SupervisorIcon color="secondary" />;
            case 'supervisor_request_result':
                return <SupervisorIcon color="secondary" />;
            default:
                return <CommentIcon />;
        }
    };

    // Get avatar color based on sender role
    const getAvatarColor = (role) => {
        switch (role) {
            case 'supervisor':
                return 'primary.main';
            case 'apprentice':
                return 'secondary.main';
            case 'system':
                return 'warning.main';
            default:
                return 'grey.500';
        }
    };

    // Filter notifications based on active tab
    const filteredNotifications = activeTab === 0
        ? notifications
        : activeTab === 1
            ? notifications.filter(n => !n.read)
            : notifications.filter(n => n.read);

    const hasActionableNotifications = notifications.some(
        n => n.type === 'supervisor_request' &&
            (!n.additionalData?.requestStatus || n.additionalData.requestStatus === 'pending')
    );

    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            PaperProps={{
                style: { width: 400, maxHeight: 600 }
            }}
        >
            <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Notifications</Typography>
                {notifications.some(n => !n.read) && (
                    <Button
                        size="small"
                        startIcon={<MarkReadIcon />}
                        onClick={markAllAsRead}
                    >
                        Mark all as read
                    </Button>
                )}
            </Box>

            <Divider />

            {/* Tabs for All/Unread/Read */}
            <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                variant="fullWidth"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
                <Tab label="All" />
                <Tab
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <span>Unread</span>
                            {notifications.filter(n => !n.read).length > 0 && (
                                <Chip
                                    size="small"
                                    color="primary"
                                    label={notifications.filter(n => !n.read).length}
                                    sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
                                />
                            )}
                        </Box>
                    }
                />
                <Tab label="Read" />
            </Tabs>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={30} />
                </Box>
            ) : indexError ? (
                <Box sx={{ p: 2 }}>
                    <Typography variant="body2" gutterBottom>
                        This feature requires a Firestore index to work properly.
                    </Typography>
                    <Button
                        variant="outlined"
                        size="small"
                        color="primary"
                        href={indexUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ mt: 1 }}
                    >
                        Create Required Index
                    </Button>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        After creating the index, it may take a few minutes to become active.
                    </Typography>
                </Box>
            ) : error ? (
                <Box sx={{ p: 2 }}>
                    <Typography color="error">{error}</Typography>
                </Box>
            ) : filteredNotifications.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">No notifications</Typography>
                </Box>
            ) : (
                <List sx={{ p: 0 }}>
                    {/* Display supervisor request notifications with action buttons first */}
                    {userProfile?.role === 'supervisor' && hasActionableNotifications && (
                        <>
                            <Box sx={{ p: 2, bgcolor: 'action.selected' }}>
                                <Typography variant="subtitle2">Supervisor Requests</Typography>
                            </Box>
                            {filteredNotifications
                                .filter(n => n.type === 'supervisor_request' &&
                                    (!n.additionalData?.requestStatus || n.additionalData.requestStatus === 'pending'))
                                .map(notification => (
                                    <ActionableNotification
                                        key={notification.id}
                                        notification={notification}
                                        onActionComplete={handleActionComplete}
                                    />
                                ))
                            }
                            <Divider />
                            <Box sx={{ p: 2, bgcolor: 'action.selected' }}>
                                <Typography variant="subtitle2">Other Notifications</Typography>
                            </Box>
                        </>
                    )}

                    {/* Display regular notifications */}
                    {filteredNotifications
                        .filter(n => n.type !== 'supervisor_request' ||
                            (n.additionalData?.requestStatus && n.additionalData.requestStatus !== 'pending'))
                        .map((notification) => (
                            <Box key={notification.id}>
                                <ListItem
                                    button
                                    onClick={() => handleNotificationClick(notification)}
                                    sx={{
                                        bgcolor: notification.read ? 'inherit' : 'action.hover',
                                        '&:hover': { bgcolor: 'action.selected' }
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: getAvatarColor(notification.senderRole) }}>
                                            {getNotificationIcon(notification.type)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ pr: 6 }}>
                                                <Typography variant="body2" component="span" fontWeight={notification.read ? 'normal' : 'bold'}>
                                                    {notification.message}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                                                {notification.goalTitle && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {notification.goalTitle}
                                                    </Typography>
                                                )}
                                                <Typography variant="caption" color="text.secondary">
                                                    {notification.createdAt ? formatDistanceToNow(notification.createdAt, { addSuffix: true }) : ''}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                    {!notification.read && (
                                        <ListItemSecondaryAction>
                                            <Chip size="small" color="primary" label="New" />
                                        </ListItemSecondaryAction>
                                    )}
                                </ListItem>
                                <Divider component="li" />
                            </Box>
                        ))}
                </List>
            )}
        </Popover>
    );
};

export default NotificationsPopup;