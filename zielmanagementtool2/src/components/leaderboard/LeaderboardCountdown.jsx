import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    CircularProgress
} from '@mui/material';
import { AccessTime as ClockIcon } from '@mui/icons-material';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const LeaderboardCountdown = () => {
    const [countdown, setCountdown] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        const fetchCountdown = async () => {
            try {
                // Get countdown from settings collection
                const countdownDoc = await getDoc(doc(db, 'settings', 'leaderboard'));

                if (countdownDoc.exists() && countdownDoc.data().countdown) {
                    const countdownData = countdownDoc.data().countdown;
                    setCountdown(countdownData);
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching countdown:', err);
                setLoading(false);
            }
        };

        fetchCountdown();
    }, []);

    useEffect(() => {
        if (!countdown || !countdown.endDate) return;

        const calculateTimeLeft = () => {
            const endDate = countdown.endDate.toDate();
            const difference = endDate.getTime() - new Date().getTime();

            if (difference <= 0) {
                // Countdown has ended
                setTimeLeft({
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0
                });
                return;
            }

            setTimeLeft({
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / (1000 * 60)) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            });
        };

        // Calculate immediately
        calculateTimeLeft();

        // Then set up interval to update every second
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [countdown]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (!countdown || !countdown.endDate) {
        return null; // No countdown set
    }

    // Check if countdown has ended
    const isEnded = (timeLeft.days === 0 && timeLeft.hours === 0 &&
        timeLeft.minutes === 0 && timeLeft.seconds === 0);

    return (
        <Paper
            sx={{
                p: 3,
                textAlign: 'center',
                backgroundColor: isEnded ? 'background.paper' : countdown.backgroundColor || '#f5f5f5',
                color: isEnded ? 'text.primary' : countdown.textColor || 'inherit'
            }}
        >
            {isEnded ? (
                <Box>
                    <Typography variant="h5" sx={{ mb: 1 }}>
                        {countdown.completionMessage || 'Time is up!'}
                    </Typography>
                </Box>
            ) : (

                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Chip
                                label={timeLeft.days}
                                sx={{ fontSize: '1.5rem', height: 'auto', p: 2 }}
                            />
                            <Typography variant="body2" sx={{ mt: 1 }}>Days</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <Chip
                                label={timeLeft.hours}
                                sx={{ fontSize: '1.5rem', height: 'auto', p: 2 }}
                            />
                            <Typography variant="body2" sx={{ mt: 1 }}>Hours</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <Chip
                                label={timeLeft.minutes}
                                sx={{ fontSize: '1.5rem', height: 'auto', p: 2 }}
                            />
                            <Typography variant="body2" sx={{ mt: 1 }}>Minutes</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <Chip
                                label={timeLeft.seconds}
                                sx={{ fontSize: '1.5rem', height: 'auto', p: 2 }}
                            />
                            <Typography variant="body2" sx={{ mt: 1 }}>Seconds</Typography>
                        </Box>
                </Box>
            )}
       </Paper>
    );
};

export default LeaderboardCountdown;