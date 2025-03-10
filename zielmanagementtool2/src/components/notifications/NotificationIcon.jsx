import { useState, useEffect } from 'react';
import {
    IconButton,
    Badge,
    Tooltip,
    CircularProgress
} from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';

const NotificationIcon = ({ onClick }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) return;

        // Create a query to get unread notifications for the current user
        const q = query(
            collection(db, 'notifications'),
            where('recipientId', '==', currentUser.uid),
            where('read', '==', false),
            orderBy('createdAt', 'desc')
        );

        // Set up a real-time listener
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUnreadCount(snapshot.size);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching notifications:", error);
            setLoading(false);
        });

        // Cleanup the listener when the component unmounts
        return () => unsubscribe();
    }, [currentUser]);

    if (loading) {
        return (
            <IconButton color="inherit" disabled>
                <CircularProgress size={20} color="inherit" />
            </IconButton>
        );
    }

    return (
        <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={onClick} aria-label="notifications">
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>
        </Tooltip>
    );
};

export default NotificationIcon;