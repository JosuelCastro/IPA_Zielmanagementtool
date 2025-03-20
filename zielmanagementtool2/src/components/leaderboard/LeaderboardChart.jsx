import { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert, Chip } from '@mui/material';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const LeaderboardChart = () => {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [resetTimestamp, setResetTimestamp] = useState(null);

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

                // Process each apprentice
                const apprenticeProcessing = userSnapshot.docs.map(async (doc) => {
                    const apprentice = {
                        id: doc.id,
                        ...doc.data()
                    };

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

                    if (approvedGoalCount > 0) {
                        apprenticeData.push({
                            name: `${apprentice.firstName} ${apprentice.lastName.charAt(0)}.`,
                            totalStars: totalRating,
                            averageRating: (totalRating / approvedGoalCount).toFixed(1),
                            goals: approvedGoalCount
                        });
                    }
                });

                // Wait for all apprentices to be processed
                await Promise.all(apprenticeProcessing);

                // Sort by total stars and limit to top 10
                apprenticeData.sort((a, b) => b.totalStars - a.totalStars);
                setChartData(apprenticeData.slice(0, 10));
                setLoading(false);
            } catch (err) {
                console.error('Error fetching chart data:', err);
                setError('Failed to load chart data. Please try again later.');
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

    return (
        <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h6">
                    Top Apprentices by Rating
                </Typography>
                {resetTimestamp && (
                    <Chip
                        label={`Daten seit: ${formatDate(resetTimestamp)}`}
                        color="primary"
                        size="small"
                        variant="outlined"
                    />
                )}
            </Box>

            {chartData.length > 0 ? (
                <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                            <Tooltip />
                            <Legend />
                            <Bar yAxisId="left" dataKey="totalStars" name="Total Stars" fill="#8884d8" />
                            <Bar yAxisId="right" dataKey="goals" name="Approved Goals" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                    No data available for chart visualization.
                </Typography>
            )}
        </Paper>
    );
};

export default LeaderboardChart;