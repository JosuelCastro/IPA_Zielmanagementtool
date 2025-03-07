import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    CardActions,
    Grid,
    Chip,
    CircularProgress,
    Alert, Grid2
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

// Helper function to get status color
const getStatusColor = (status) => {
    switch (status) {
        case 'planned':
            return 'info';
        case 'in_progress':
            return 'warning';
        case 'completed':
            return 'success';
        default:
            return 'default';
    }
};

// Helper function to get category label
const getCategoryLabel = (category) => {
    switch (category) {
        case 'technical':
            return 'Technical Skills';
        case 'soft':
            return 'Soft Skills';
        case 'education':
            return 'Education & Training';
        case 'project':
            return 'Project Delivery';
        default:
            return category;
    }
};

const GoalList = () => {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { currentUser } = useAuth();

    useEffect(() => {
        const q = query(
            collection(db, 'goals'),
            where('apprenticeId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            (querySnapshot) => {
                const goalsData = [];
                querySnapshot.forEach((doc) => {
                    goalsData.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                setGoals(goalsData);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching goals:', err);
                setError('Failed to load goals. Please try again later.');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser.uid]);

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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">My Goals</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    component={RouterLink}
                    to="/goals/create"
                >
                    Add Goal
                </Button>
            </Box>

            {goals.length === 0 ? (
                <Card sx={{ p: 4, textAlign: 'center' }}>
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
                </Card>
            ) : (
                <Grid2 container spacing={3}>
                    {goals.map((goal) => (
                        <Grid2 item xs={12} sm={6} md={4} key={goal.id}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" gutterBottom>
                                        {goal.title}
                                    </Typography>
                                    <Box sx={{ mb: 2 }}>
                                        <Chip
                                            label={goal.status === 'in_progress' ? 'In Progress' : goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                                            color={getStatusColor(goal.status)}
                                            size="small"
                                            sx={{ mr: 1, mb: 1 }}
                                        />
                                        <Chip
                                            label={getCategoryLabel(goal.category)}
                                            variant="outlined"
                                            size="small"
                                            sx={{ mb: 1 }}
                                        />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {goal.description.length > 100
                                            ? `${goal.description.substring(0, 100)}...`
                                            : goal.description}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Start:</strong> {goal.startDate ? format(goal.startDate.toDate(), 'MM/dd/yyyy') : 'N/A'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>End:</strong> {goal.endDate ? format(goal.endDate.toDate(), 'MM/dd/yyyy') : 'N/A'}
                                    </Typography>
                                </CardContent>
                                <CardActions>
                                    <Button size="small" component={RouterLink} to={`/goals/${goal.id}`}>
                                        View Details
                                    </Button>
                                    {!goal.submitted && (
                                        <Button size="small" component={RouterLink} to={`/goals/${goal.id}/edit`}>
                                            Edit
                                        </Button>
                                    )}
                                </CardActions>
                            </Card>
                        </Grid2>
                    ))}
                </Grid2>
            )}
        </Box>
    );
};

export default GoalList;