import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Button,
    CircularProgress,
    Alert,
    Chip,
    LinearProgress, Grid2
} from '@mui/material';
import {
    Add as AddIcon,
    Assignment as AssignmentIcon,
    Check as CheckIcon,
    Pending as PendingIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import LeaderboardStats from '../leaderboard/LeaderboardStats';

const ApprenticeDashboard = () => {
    const [goals, setGoals] = useState([]);
    const [statistics, setStatistics] = useState({
        total: 0,
        submitted: 0,
        approved: 0,
        inProgress: 0,
        planned: 0,
        completed: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchGoals = async () => {
            try {
                const q = query(
                    collection(db, 'goals'),
                    where('apprenticeId', '==', currentUser.uid)
                );

                const querySnapshot = await getDocs(q);
                const goalsData = [];

                let stats = {
                    total: 0,
                    submitted: 0,
                    approved: 0,
                    inProgress: 0,
                    planned: 0,
                    completed: 0
                };

                querySnapshot.forEach((doc) => {
                    const goalData = {
                        id: doc.id,
                        ...doc.data()
                    };

                    goalsData.push(goalData);

                    // Update statistics
                    stats.total++;
                    if (goalData.submitted) stats.submitted++;
                    if (goalData.approved) stats.approved++;

                    switch (goalData.status) {
                        case 'in_progress':
                            stats.inProgress++;
                            break;
                        case 'planned':
                            stats.planned++;
                            break;
                        case 'completed':
                            stats.completed++;
                            break;
                        default:
                            break;
                    }
                });

                setGoals(goalsData);
                setStatistics(stats);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching goals:', err);
                setError('Failed to load goals. Please try again later.');
                setLoading(false);
            }
        };

        fetchGoals();
    }, [currentUser.uid]);

    const renderStatCard = (title, value, total, icon, color) => (
        <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{
                    bgcolor: `${color}.light`,
                    color: `${color}.main`,
                    p: 1,
                    borderRadius: 1,
                    mr: 2
                }}>
                    {icon}
                </Box>
                <Typography variant="h6" color="text.secondary">
                    {title}
                </Typography>
            </Box>
            <Typography variant="h4" sx={{ mb: 1 }}>
                {value}
            </Typography>
            {total > 0 && (
                <>
                    <LinearProgress
                        variant="determinate"
                        value={(value / total) * 100}
                        sx={{ mb: 1, height: 8, borderRadius: 4 }}
                        color={color}
                    />
                    <Typography variant="body2" color="text.secondary">
                        {((value / total) * 100).toFixed(0)}% ({value}/{total})
                    </Typography>
                </>
            )}
        </Paper>
    );

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
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4">Dashboard</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    component={RouterLink}
                    to="/goals/create"
                >
                    Add New Goal
                </Button>
            </Box>

            <Grid2 container spacing={3} sx={{ mb: 4 }}>
                <Grid2 item xs={12} sm={6} md={3}>
                    {renderStatCard(
                        'Total Goals',
                        statistics.total,
                        Math.max(3, statistics.total),
                        <AssignmentIcon />,
                        'primary'
                    )}
                </Grid2>
                <Grid2 item xs={12} sm={6} md={3}>
                    {renderStatCard(
                        'In Progress',
                        statistics.inProgress,
                        statistics.total,
                        <AssignmentIcon />,
                        'warning'
                    )}
                </Grid2>

                <Grid2 item xs={12} sm={6} md={3}>
                    {renderStatCard(
                        'Submitted',
                        statistics.submitted,
                        statistics.total,
                        <PendingIcon />,
                        'info'
                    )}
                </Grid2>
                <Grid2 item xs={12} sm={6} md={3}>
                    {renderStatCard(
                        'Approved',
                        statistics.approved,
                        statistics.total,
                        <CheckIcon />,
                        'success'
                    )}
                </Grid2>
            </Grid2>

            <Typography variant="h5" gutterBottom>
                Recent Goals
            </Typography>

            {goals.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body1" gutterBottom>
                        You haven't created any goals yet.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        component={RouterLink}
                        to="/goals/create"
                        sx={{ mt: 2 }}
                    >
                        Create Your First Goal
                    </Button>
                </Paper>
            ) : (
                <Grid2 container spacing={3}>
                    {goals.slice(0, 3).map((goal) => (
                        <Grid2 item xs={12} key={goal.id}>
                            <Paper sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box>
                                        <Typography variant="h6" gutterBottom>
                                            {goal.title}
                                        </Typography>
                                        <Box sx={{ mb: 2 }}>
                                            <Chip
                                                label={goal.status === 'in_progress' ? 'In Progress' : goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                                                color={
                                                    goal.status === 'completed' ? 'success' :
                                                        goal.status === 'in_progress' ? 'warning' : 'default'
                                                }
                                                size="small"
                                                sx={{ mr: 1 }}
                                            />
                                            {goal.submitted && (
                                                <Chip
                                                    label="Submitted"
                                                    color="primary"
                                                    size="small"
                                                    sx={{ mr: 1 }}
                                                />
                                            )}
                                            {goal.approved && (
                                                <Chip
                                                    label="Approved"
                                                    color="success"
                                                    size="small"
                                                />
                                            )}
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {goal.description.length > 150
                                                ? `${goal.description.substring(0, 150)}...`
                                                : goal.description}
                                        </Typography>
                                    </Box>
                                    <Button
                                        variant="outlined"
                                        component={RouterLink}
                                        to={`/goals/${goal.id}`}
                                        sx={{ ml: 2 }}
                                    >
                                        View Details
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid2>
                    ))}

                    {goals.length > 3 && (
                        <Grid2 item xs={12}>
                            <Box sx={{ textAlign: 'center'}}>
                                <Button
                                    variant="outlined"
                                    component={RouterLink}
                                    to="/goals"
                                >
                                    View All Goals
                                </Button>
                            </Box>
                        </Grid2>
                    )}
                </Grid2>
            )}
            <Typography mt={4} variant="h5" gutterBottom>
                Current Ranking
            </Typography>
            <Grid2 item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                <LeaderboardStats />
                </Box>
            </Grid2>
        </Box>
    );
};

export default ApprenticeDashboard;