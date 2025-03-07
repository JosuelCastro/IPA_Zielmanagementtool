import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Chip,
    Button,
    Divider,
    Avatar,
    Paper, Grid2
} from '@mui/material';
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc
} from 'firebase/firestore';
import { getStatusColor, getCategoryLabel } from '../../utils/helpers';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

// Helper functions for status and category are the same as in GoalList

const ApprenticeDetail = () => {
    const { apprenticeId } = useParams();
    const [apprentice, setApprentice] = useState(null);
    const [goals, setGoals] = useState([]);
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

                // Get apprentice info
                const apprenticeDoc = await getDoc(doc(db, 'users', apprenticeId));

                if (!apprenticeDoc.exists()) {
                    setError('Apprentice not found');
                    setLoading(false);
                    return;
                }

                const apprenticeData = {
                    id: apprenticeDoc.id,
                    ...apprenticeDoc.data()
                };

                // Verify this is an apprentice
                if (apprenticeData.role !== 'apprentice') {
                    setError('User is not an apprentice');
                    setLoading(false);
                    return;
                }

                setApprentice(apprenticeData);

                // Get apprentice's goals
                const goalsQuery = query(
                    collection(db, 'goals'),
                    where('apprenticeId', '==', apprenticeId)
                );

                const goalsSnapshot = await getDocs(goalsQuery);
                const goalsData = [];

                goalsSnapshot.forEach((doc) => {
                    goalsData.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                // Sort goals by submitted status and then by creation date
                goalsData.sort((a, b) => {
                    if (a.submitted === b.submitted) {
                        // If both are submitted or both are not submitted, sort by creation date
                        const dateA = a.createdAt?.toDate() || new Date(0);
                        const dateB = b.createdAt?.toDate() || new Date(0);
                        return dateB - dateA; // Sort newest first
                    }
                    // Put submitted goals first
                    return a.submitted ? -1 : 1;
                });

                setGoals(goalsData);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load data. Please try again later.');
                setLoading(false);
            }
        };

        fetchData();
    }, [apprenticeId, userProfile]);

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
                <Button
                    component={RouterLink}
                    to="/apprentices"
                    variant="outlined"
                    sx={{ mt: 2 }}
                >
                    Back to Apprentices
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Button
                    component={RouterLink}
                    to="/apprentices"
                    variant="outlined"
                    sx={{ mb: 2 }}
                >
                    Back to Apprentices
                </Button>

                <Paper sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 60, height: 60, fontSize: 24, mr: 3 }}>
                            {apprentice.firstName.charAt(0)}
                            {apprentice.lastName.charAt(0)}
                        </Avatar>
                        <Box>
                            <Typography variant="h5">
                                {apprentice.firstName} {apprentice.lastName}
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                {apprentice.email}
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>

            <Typography variant="h5" gutterBottom>
                Goals
            </Typography>

            {goals.length === 0 ? (
                <Card sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body1">
                        This apprentice has not created any goals yet.
                    </Typography>
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
                                        {goal.submitted && (
                                            <Chip
                                                label="Submitted"
                                                color="primary"
                                                size="small"
                                                sx={{ ml: 1, mb: 1 }}
                                            />
                                        )}
                                        {goal.approved && (
                                            <Chip
                                                label="Approved"
                                                color="success"
                                                size="small"
                                                sx={{ ml: 1, mb: 1 }}
                                            />
                                        )}
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {goal.description.length > 100
                                            ? `${goal.description.substring(0, 100)}...`
                                            : goal.description}
                                    </Typography>

                                    {goal.submitted && (
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Submitted:</strong> {goal.submittedAt ? format(goal.submittedAt.toDate(), 'MM/dd/yyyy') : 'N/A'}
                                        </Typography>
                                    )}
                                </CardContent>

                                <Box sx={{ p: 2, pt: 0 }}>
                                    <Button
                                        variant="contained"
                                        component={RouterLink}
                                        to={`/goals/${goal.id}/review`}
                                        fullWidth
                                        disabled={!goal.submitted}
                                    >
                                        {goal.approved ? 'View Review' : goal.submitted ? 'Review Goal' : 'Not Submitted'}
                                    </Button>
                                </Box>
                            </Card>
                        </Grid2>
                    ))}
                </Grid2>
            )}
        </Box>
    );
};

export default ApprenticeDetail;