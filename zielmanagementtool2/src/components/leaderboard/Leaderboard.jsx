import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    Rating,
    Card,
    CardContent,
    Divider,
    Chip
} from '@mui/material';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { EmojiEvents as TrophyIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import LeaderboardCountdown from './LeaderboardCountdown';
import LeaderboardCountdownSettings from './LeaderboardCountdownSettings';

const Leaderboard = () => {
    const [apprentices, setApprentices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [resetTimestamp, setResetTimestamp] = useState(null);
    const { userProfile } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Zuerst Leaderboard-Einstellungen abrufen, um den Reset-Timestamp zu bekommen
                const settingsDoc = await getDoc(doc(db, 'settings', 'leaderboard'));
                let resetDate = null;

                if (settingsDoc.exists() && settingsDoc.data().leaderboardResetTimestamp) {
                    resetDate = settingsDoc.data().leaderboardResetTimestamp;
                    setResetTimestamp(resetDate);
                }

                // Get all users with role 'apprentice'
                const userQuery = query(
                    collection(db, 'users'),
                    where('role', '==', 'apprentice')
                );

                const userSnapshot = await getDocs(userQuery);
                const apprenticeData = [];

                // First gather all the apprentices
                userSnapshot.forEach((doc) => {
                    apprenticeData.push({
                        id: doc.id,
                        ...doc.data(),
                        totalRating: 0,
                        goalCount: 0,
                        approvedGoalCount: 0,
                        averageRating: 0
                    });
                });

                // Now get all the goals for each apprentice
                const goalPromises = apprenticeData.map(async (apprentice) => {
                    // Basisabfrage erstellen
                    let goalQuery;

                    if (resetDate) {
                        // Nur Ziele, die nach dem letzten Reset genehmigt wurden
                        goalQuery = query(
                            collection(db, 'goals'),
                            where('apprenticeId', '==', apprentice.id),
                            where('approved', '==', true),
                            where('approvedAt', '>=', resetDate)
                        );
                    } else {
                        // Alle genehmigten Ziele, wenn kein Reset erfolgt ist
                        goalQuery = query(
                            collection(db, 'goals'),
                            where('apprenticeId', '==', apprentice.id),
                            where('approved', '==', true)
                        );
                    }

                    const goalSnapshot = await getDocs(goalQuery);
                    let totalRating = 0;
                    let approvedGoalCount = 0;

                    goalSnapshot.forEach((goalDoc) => {
                        const goalData = goalDoc.data();
                        if (goalData.rating) {
                            totalRating += goalData.rating;
                            approvedGoalCount += 1;
                        }
                    });

                    // Update apprentice with goal stats
                    apprentice.totalRating = totalRating;
                    apprentice.approvedGoalCount = approvedGoalCount;
                    apprentice.averageRating = approvedGoalCount > 0 ? totalRating / approvedGoalCount : 0;

                    return apprentice;
                });

                // Wait for all promises to resolve
                const updatedApprentices = await Promise.all(goalPromises);

                // Sort by total rating (highest first)
                updatedApprentices.sort((a, b) => b.totalRating - a.totalRating);

                setApprentices(updatedApprentices);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching leaderboard data:', err);
                setError('Failed to load leaderboard data. Please try again later.');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatDate = (timestamp) => {
        if (!timestamp) return null;

        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    };

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

    // Find apprentice of the year (the one with highest rating)
    const apprenticeOfTheYear = apprentices.length > 0 ? apprentices[0] : null;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">
                    Apprentice Leaderboard
                </Typography>

                {resetTimestamp && (
                    <Chip
                        label={`Laufendes Jahr: seit ${formatDate(resetTimestamp)}`}
                        color="primary"
                        variant="outlined"
                    />
                )}
            </Box>

            {userProfile?.role === 'supervisor' && <LeaderboardCountdownSettings />}

            {apprenticeOfTheYear && (
                <Card sx={{ mb: 4, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <TrophyIcon sx={{ fontSize: 80, color: 'gold' }} />
                        <Typography variant="h6">
                            Currently going for
                        </Typography>
                        <Typography variant="h4" gutterBottom>
                            Apprentice of the Year
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                            <Avatar
                                sx={{ width: 80, height: 80, mr: 2, bgcolor: 'primary.dark' }}
                            >
                                {apprenticeOfTheYear.firstName.charAt(0)}
                                {apprenticeOfTheYear.lastName.charAt(0)}
                            </Avatar>
                            <Box>
                                <Typography variant="h6">
                                    {apprenticeOfTheYear.firstName} {apprenticeOfTheYear.lastName}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Rating
                                        value={apprenticeOfTheYear.averageRating}
                                        precision={0.5}
                                        readOnly
                                        sx={{ mr: 1 }}
                                    />
                                    <Typography variant="body1">
                                        ({apprenticeOfTheYear.totalRating} total stars from {apprenticeOfTheYear.approvedGoalCount} goals)
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </CardContent>
                    <LeaderboardCountdown />
                </Card>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Rank</TableCell>
                            <TableCell>Apprentice</TableCell>
                            <TableCell align="center">Average Rating</TableCell>
                            <TableCell align="center">Approved Goals</TableCell>
                            <TableCell align="center">Total Stars</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {apprentices.map((apprentice, index) => (
                            <TableRow
                                key={apprentice.id}
                                sx={{
                                    bgcolor: index === 0 ? 'rgba(255, 215, 0, 0.1)' :
                                        index === 1 ? 'rgba(192, 192, 192, 0.1)' :
                                            index === 2 ? 'rgba(205, 127, 50, 0.1)' :
                                                'inherit'
                                }}
                            >
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Avatar sx={{ mr: 2 }}>
                                            {apprentice.firstName.charAt(0)}
                                            {apprentice.lastName.charAt(0)}
                                        </Avatar>
                                        <Typography>
                                            {apprentice.firstName} {apprentice.lastName}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell align="center">
                                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                        <Rating value={apprentice.averageRating} precision={0.5} readOnly />
                                    </Box>
                                </TableCell>
                                <TableCell align="center">{apprentice.approvedGoalCount}</TableCell>
                                <TableCell align="center">{apprentice.totalRating}</TableCell>
                            </TableRow>
                        ))}
                        {apprentices.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    No apprentices with approved goals yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default Leaderboard;