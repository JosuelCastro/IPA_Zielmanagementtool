import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Button,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemText,
    Chip,
    Divider,
    Avatar, Grid2
} from '@mui/material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import LeaderboardStats from '../leaderboard/LeaderboardStats';
import LeaderboardChart from '../leaderboard/LeaderboardChart';

const SupervisorDashboard = () => {
    const [pendingReviews, setPendingReviews] = useState([]);
    const [apprenticeCount, setApprenticeCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { userProfile } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Check if user is a supervisor
                if (userProfile?.role !== 'supervisor') {
                    setError('You do not have permission to view this page.');
                    setLoading(false);
                    return;
                }

                // Count apprentices
                const apprenticesQuery = query(
                    collection(db, 'users'),
                    where('role', '==', 'apprentice')
                );

                const apprenticesSnapshot = await getDocs(apprenticesQuery);
                setApprenticeCount(apprenticesSnapshot.size);

                // Get submitted but not approved goals
                const goalsQuery = query(
                    collection(db, 'goals'),
                    where('submitted', '==', true),
                    where('approved', '==', false)
                );

                const goalsSnapshot = await getDocs(goalsQuery);
                const pendingGoals = [];

                goalsSnapshot.forEach((doc) => {
                    pendingGoals.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                // Sort by submission date (newest first)
                pendingGoals.sort((a, b) => {
                    const dateA = a.submittedAt?.toDate() || new Date(0);
                    const dateB = b.submittedAt?.toDate() || new Date(0);
                    return dateB - dateA;
                });

                setPendingReviews(pendingGoals);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load dashboard data. Please try again later.');
                setLoading(false);
            }
        };

        fetchData();
    }, [userProfile]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Supervisor Dashboard
            </Typography>

            <Grid2 container spacing={3}>
                <Grid2 item xs={12} md={4}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Overview
                        </Typography>
                        <List>
                            <ListItem>
                                <ListItemText
                                    primary="Total Apprentices"
                                    secondary={apprenticeCount}
                                />
                            </ListItem>
                            <Divider />
                            <ListItem>
                                <ListItemText
                                    primary="Pending Reviews"
                                    secondary={pendingReviews.length}
                                />
                            </ListItem>
                        </List>
                        <Button
                            variant="contained"
                            component={RouterLink}
                            to="/apprentices"
                            fullWidth
                            sx={{ mt: 2 }}
                        >
                            View All Apprentices
                        </Button>
                    </Paper>
                </Grid2>

                <Grid2 item xs={12} md={8}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Pending Reviews
                        </Typography>

                        {pendingReviews.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 3 }}>
                                <Typography variant="body1" color="text.secondary">
                                    No pending reviews at the moment.
                                </Typography>
                            </Box>
                        ) : (
                            <List>
                                {pendingReviews.map((goal) => (
                                    <Box key={goal.id}>
                                        <ListItem
                                            disableGutters
                                            sx={{
                                                flexDirection: { xs: 'column', sm: 'row' },
                                                alignItems: { xs: 'flex-start', sm: 'center' },
                                                py: 2
                                            }}
                                        >
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                width: '100%',
                                                mb: { xs: 2, sm: 0 }
                                            }}>
                                                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                                    {goal.apprenticeName?.split(' ').map(name => name[0]).join('')}
                                                </Avatar>
                                                <Box sx={{ flexGrow: 1, mr: { xs: 0, sm: 2 } }}>
                                                    <Typography variant="subtitle1">
                                                        {goal.title}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {goal.apprenticeName} • Submitted {goal.submittedAt ? format(goal.submittedAt.toDate(), 'MMM d, yyyy') : 'N/A'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Box sx={{
                                                display: 'flex',
                                                justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                                                width: { xs: '100%', sm: 'auto' }
                                            }}>
                                                <Button
                                                    variant="contained"
                                                    component={RouterLink}
                                                    to={`/goals/${goal.id}/review`}
                                                    size="small"
                                                >
                                                    Review
                                                </Button>
                                            </Box>
                                        </ListItem>
                                        <Divider />
                                    </Box>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid2>
            </Grid2>

            <Grid2 item xs={12} mt={4}>
                <LeaderboardStats />
            </Grid2>
            <Grid2 item xs={12} mt={4}>
                <LeaderboardChart />
            </Grid2>
        </Box>
    );
};

export default SupervisorDashboard;