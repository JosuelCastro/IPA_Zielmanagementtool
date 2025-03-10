import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    Button,
    Avatar,
    Rating,
    CircularProgress,
    Divider
} from '@mui/material';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { EmojiEvents as TrophyIcon, Leaderboard as LeaderboardIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const LeaderboardStats = () => {
    const [topApprentices, setTopApprentices] = useState([]);
    const [userRank, setUserRank] = useState(null);
    const [loading, setLoading] = useState(true);
    const { currentUser, userProfile } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Structure to hold all apprentices with their ratings
                const apprenticeRatings = [];

                // Get all users with role 'apprentice'
                const userQuery = query(
                    collection(db, 'users'),
                    where('role', '==', 'apprentice')
                );

                const userSnapshot = await getDocs(userQuery);

                // Process each apprentice
                const apprenticeProcessing = userSnapshot.docs.map(async (doc) => {
                    const apprentice = {
                        id: doc.id,
                        ...doc.data(),
                        totalRating: 0,
                        approvedGoalCount: 0,
                        averageRating: 0
                    };

                    // Get approved goals for this apprentice
                    const goalQuery = query(
                        collection(db, 'goals'),
                        where('apprenticeId', '==', apprentice.id),
                        where('approved', '==', true)
                    );

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

                    apprentice.totalRating = totalRating;
                    apprentice.approvedGoalCount = approvedGoalCount;
                    apprentice.averageRating = approvedGoalCount > 0 ? totalRating / approvedGoalCount : 0;

                    apprenticeRatings.push(apprentice);
                });

                // Wait for all apprentices to be processed
                await Promise.all(apprenticeProcessing);

                // Sort apprentices by total rating (highest first)
                apprenticeRatings.sort((a, b) => b.totalRating - a.totalRating);

                // Get top 3 apprentices
                setTopApprentices(apprenticeRatings.slice(0, 3));

                // Find current user's rank if they're an apprentice
                if (userProfile?.role === 'apprentice') {
                    const userIndex = apprenticeRatings.findIndex(apprentice => apprentice.id === currentUser.uid);
                    if (userIndex !== -1) {
                        setUserRank({
                            rank: userIndex + 1,
                            ...apprenticeRatings[userIndex]
                        });
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching leaderboard data:', err);
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser, userProfile]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                        Leaderboard
                    </Typography>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<LeaderboardIcon />}
                        component={RouterLink}
                        to="/leaderboard"
                    >
                        View Full Leaderboard
                    </Button>
                </Box>

                {topApprentices.length > 0 ? (
                    <>
                        {topApprentices.map((apprentice, index) => (
                            <Box key={apprentice.id} sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="h6" sx={{ minWidth: 30 }}>
                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                    </Typography>
                                    <Avatar sx={{ mr: 2 }}>
                                        {apprentice.firstName.charAt(0)}
                                        {apprentice.lastName.charAt(0)}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="body1">
                                            {apprentice.firstName} {apprentice.lastName}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Rating value={apprentice.averageRating} precision={0.5} readOnly size="small" />
                                            <Typography variant="body2" sx={{ ml: 1 }}>
                                                ({apprentice.totalRating} stars)
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                {index < topApprentices.length - 1 && <Divider sx={{ my: 2 }} />}
                            </Box>
                        ))}

                        {userRank && userRank.rank > 3 && (
                            <>
                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
                                    <Typography variant="body1" sx={{ minWidth: 30 }}>
                                        {userRank.rank}
                                    </Typography>
                                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                        {userRank.firstName.charAt(0)}
                                        {userRank.lastName.charAt(0)}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="body1">
                                            You
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Rating value={userRank.averageRating} precision={0.5} readOnly size="small" />
                                            <Typography variant="body2" sx={{ ml: 1 }}>
                                                ({userRank.totalRating} stars)
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </>
                        )}
                    </>
                ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        No apprentices with approved goals yet.
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
};

export default LeaderboardStats;