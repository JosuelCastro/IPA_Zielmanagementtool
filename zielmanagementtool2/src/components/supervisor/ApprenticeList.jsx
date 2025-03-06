import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    CircularProgress,
    Alert,
    Chip,
    Button,
    Avatar
} from '@mui/material';
import {
    collection,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';

const ApprenticeList = () => {
    const [apprentices, setApprentices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { userProfile } = useAuth();

    useEffect(() => {
        const fetchApprentices = async () => {
            try {
                // Get all users with role 'apprentice'
                const q = query(
                    collection(db, 'users'),
                    where('role', '==', 'apprentice')
                );

                const querySnapshot = await getDocs(q);
                const apprenticeData = [];

                querySnapshot.forEach((doc) => {
                    apprenticeData.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                // For each apprentice, get the number of submitted goals
                const apprenticesWithGoalCount = await Promise.all(
                    apprenticeData.map(async (apprentice) => {
                        const goalsQuery = query(
                            collection(db, 'goals'),
                            where('apprenticeId', '==', apprentice.id),
                            where('submitted', '==', true)
                        );

                        const goalsSnapshot = await getDocs(goalsQuery);
                        return {
                            ...apprentice,
                            submittedGoalCount: goalsSnapshot.size
                        };
                    })
                );

                setApprentices(apprenticesWithGoalCount);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching apprentices:', err);
                setError('Failed to load apprentices. Please try again later.');
                setLoading(false);
            }
        };

        if (userProfile?.role === 'supervisor') {
            fetchApprentices();
        } else {
            setError('You do not have permission to view this page.');
            setLoading(false);
        }
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
            <Typography variant="h5" gutterBottom>
                Apprentices
            </Typography>

            {apprentices.length === 0 ? (
                <Card sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body1">
                        No apprentices found.
                    </Typography>
                </Card>
            ) : (
                <Grid container spacing={3}>
                    {apprentices.map((apprentice) => (
                        <Grid item xs={12} sm={6} md={4} key={apprentice.id}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                                            {apprentice.firstName.charAt(0)}
                                            {apprentice.lastName.charAt(0)}
                                        </Avatar>
                                        <Typography variant="h6">
                                            {apprentice.firstName} {apprentice.lastName}
                                        </Typography>
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        {apprentice.email}
                                    </Typography>

                                    <Box sx={{ mt: 2, mb: 2 }}>
                                        <Chip
                                            label={`${apprentice.submittedGoalCount} Submitted Goals`}
                                            color={apprentice.submittedGoalCount > 0 ? 'primary' : 'default'}
                                            sx={{ mr: 1 }}
                                        />
                                    </Box>

                                    <Button
                                        variant="contained"
                                        component={RouterLink}
                                        to={`/apprentices/${apprentice.id}`}
                                        fullWidth
                                    >
                                        View Goals
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
};

export default ApprenticeList;