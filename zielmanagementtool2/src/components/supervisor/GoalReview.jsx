import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Chip,
    Button,
    CircularProgress,
    Alert,
    Rating,
    TextField,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    Divider, Grid2
} from '@mui/material';
import {
    ThumbUp as ApproveIcon,
    Comment as CommentIcon
} from '@mui/icons-material';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { getStatusColor, getCategoryLabel } from '../../utils/helpers';

const GoalReview = () => {
    const { goalId } = useParams();
    const navigate = useNavigate();
    const { currentUser, userProfile } = useAuth();

    const [goal, setGoal] = useState(null);
    const [evidence, setEvidence] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [rating, setRating] = useState(0);
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Check if user is a supervisor
                if (userProfile?.role !== 'supervisor') {
                    setError('You do not have permission to view this page.');
                    setLoading(false);
                    return;
                }

                // Get goal info
                const goalDoc = await getDoc(doc(db, 'goals', goalId));

                if (!goalDoc.exists()) {
                    setError('Goal not found');
                    setLoading(false);
                    return;
                }

                const goalData = {
                    id: goalDoc.id,
                    ...goalDoc.data()
                };

                // Check if the goal is submitted
                if (!goalData.submitted) {
                    setError('This goal has not been submitted for review yet');
                    setLoading(false);
                    return;
                }

                setGoal(goalData);
                setRating(goalData.rating || 0);

                // Fetch evidence files
                const evidenceRef = ref(storage, `evidence/${goalData.apprenticeId}/${goalId}`);
                try {
                    const result = await listAll(evidenceRef);

                    const files = await Promise.all(
                        result.items.map(async (itemRef) => {
                            const url = await getDownloadURL(itemRef);
                            return {
                                name: itemRef.name,
                                url,
                                path: itemRef.fullPath
                            };
                        })
                    );

                    setEvidence(files);
                } catch (err) {
                    console.error('Error loading evidence:', err);
                    // If error is because the folder doesn't exist yet, that's ok
                    if (!err.message.includes('object-not-found')) {
                        setError('Failed to load evidence files.');
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load data. Please try again later.');
                setLoading(false);
            }
        };

        fetchData();
    }, [goalId, userProfile]);

    const handleApproveGoal = async () => {
        if (!rating) {
            alert('Please provide a rating before approving this goal.');
            return;
        }

        setSubmitting(true);

        try {
            const updateData = {
                approved: true,
                rating,
                approvedAt: serverTimestamp(),
                approvedBy: currentUser.uid,
                updatedAt: serverTimestamp()
            };

            if (commentText.trim()) {
                const now = new Date();

                const comment = {
                    text: commentText,
                    authorId: currentUser.uid,
                    authorName: `${userProfile.firstName} ${userProfile.lastName} (Supervisor)`,
                    createdAt: now
                };

                updateData.comments = [...(goal.comments || []), comment];
            }

            await updateDoc(doc(db, 'goals', goalId), updateData);

            // Refresh goal data
            const updatedGoal = await getDoc(doc(db, 'goals', goalId));
            setGoal({
                id: updatedGoal.id,
                ...updatedGoal.data()
            });

            setCommentText('');
            setSubmitting(false);

            // Send back to the apprentice detail page
            navigate(`/apprentices/${goal.apprenticeId}`);

        } catch (err) {
            console.error('Error approving goal:', err);
            setError('Failed to approve goal. Please try again.');
            setSubmitting(false);
        }
    };

    const handleAddComment = async () => {
        if (!commentText.trim()) return;

        setSubmitting(true);

        try {
            // Use a regular Date object instead of serverTimestamp() for the comment
            const now = new Date();

            const comment = {
                text: commentText,
                authorId: currentUser.uid,
                authorName: `${userProfile.firstName} ${userProfile.lastName} (Supervisor)`,
                createdAt: now
            };

            await updateDoc(doc(db, 'goals', goalId), {
                comments: [...(goal.comments || []), comment],
                updatedAt: serverTimestamp()
            });

            // Refresh goal data
            const updatedGoal = await getDoc(doc(db, 'goals', goalId));
            setGoal({
                id: updatedGoal.id,
                ...updatedGoal.data()
            });

            setCommentText('');

        } catch (err) {
            console.error('Error adding comment:', err);
            setError('Failed to add comment. Please try again.');
        } finally {
            setSubmitting(false);
        }
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
            <Box sx={{ mb: 3 }}>
                <Button
                    component={RouterLink}
                    to={`/apprentices/${goal.apprenticeId}`}
                    variant="outlined"
                    sx={{ mb: 2 }}
                >
                    Back to Apprentice
                </Button>
            </Box>

            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        {goal.title}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                        Submitted by {goal.apprenticeName}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                        <Chip
                            label={goal.status === 'in_progress' ? 'In Progress' : goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                            color={getStatusColor(goal.status)}
                            sx={{ mr: 1 }}
                        />
                        <Chip
                            label={getCategoryLabel(goal.category)}
                            variant="outlined"
                            sx={{ mr: 1 }}
                        />
                        {goal.approved ? (
                            <Chip
                                label="Approved"
                                color="success"
                            />
                        ) : (
                            <Chip
                                label="Pending Review"
                                color="primary"
                            />
                        )}
                    </Box>
                </Box>
            </Box>

            <Grid2 container spacing={3}>
                <Grid2 item xs={12} md={8}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Description
                        </Typography>
                        <Typography variant="body1" paragraph>
                            {goal.description}
                        </Typography>

                        <Grid2 container spacing={2}>
                            <Grid2 item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Start Date:</strong> {goal.startDate ? format(goal.startDate.toDate(), 'MMMM d, yyyy') : 'N/A'}
                                </Typography>
                            </Grid2>
                            <Grid2 item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>End Date:</strong> {goal.endDate ? format(goal.endDate.toDate(), 'MMMM d, yyyy') : 'N/A'}
                                </Typography>
                            </Grid2>
                            <Grid2 item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Submitted:</strong> {goal.submittedAt ? format(goal.submittedAt.toDate(), 'MMMM d, yyyy') : 'N/A'}
                                </Typography>
                            </Grid2>
                            {goal.approved && goal.approvedAt && (
                                <Grid2 item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Approved:</strong> {format(goal.approvedAt.toDate(), 'MMMM d, yyyy')}
                                    </Typography>
                                </Grid2>
                            )}
                        </Grid2>
                    </Paper>

                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Evidence
                        </Typography>

                        {evidence.length > 0 ? (
                            <List>
                                {evidence.map((file) => (
                                    <ListItem key={file.path} divider>
                                        <ListItemText
                                            primary={file.name}
                                            secondary={
                                                <Button
                                                    variant="text"
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    View File
                                                </Button>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No evidence files uploaded.
                            </Typography>
                        )}
                    </Paper>

                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Comments
                        </Typography>

                        {goal.comments && goal.comments.length > 0 ? (
                            <List>
                                {goal.comments.map((comment, index) => (
                                    <ListItem key={index} divider={index < goal.comments.length - 1}>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                    {comment.authorName}
                                                    {comment.createdAt && (
                                                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                                            {format(comment.createdAt.toDate(), 'MMM d, yyyy h:mm a')}
                                                        </Typography>
                                                    )}
                                                </Typography>
                                            }
                                            secondary={comment.text}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No comments yet.
                            </Typography>
                        )}

                        {!goal.approved && (
                            <Box sx={{ mt: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Add a comment"
                                    multiline
                                    rows={2}
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    sx={{ mb: 1 }}
                                />
                                <Button
                                    variant="contained"
                                    startIcon={<CommentIcon />}
                                    onClick={handleAddComment}
                                    disabled={!commentText.trim() || submitting}
                                >
                                    {submitting ? 'Adding...' : 'Add Comment'}
                                </Button>
                            </Box>
                        )}
                    </Paper>
                </Grid2>

                <Grid2 item xs={12} md={4}>
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Review
                            </Typography>

                            {goal.approved ? (
                                <Box>
                                    <Chip label="Approved" color="success" sx={{ mb: 2 }} />
                                    <Typography variant="body2" gutterBottom>
                                        <strong>Rating:</strong>
                                    </Typography>
                                    <Rating value={goal.rating} readOnly precision={0.5} />
                                </Box>
                            ) : (
                                <Box>
                                    <Typography variant="body2" gutterBottom>
                                        Please review this goal and provide a rating.
                                    </Typography>

                                    <Box sx={{ my: 2 }}>
                                        <Typography variant="body2" gutterBottom>
                                            <strong>Rating:</strong>
                                        </Typography>
                                        <Rating
                                            value={rating}
                                            onChange={(event, newValue) => {
                                                setRating(newValue);
                                            }}
                                            precision={0.5}
                                        />
                                    </Box>

                                    <Divider sx={{ my: 2 }} />

                                    <Button
                                        variant="contained"
                                        color="success"
                                        startIcon={<ApproveIcon />}
                                        onClick={handleApproveGoal}
                                        disabled={submitting}
                                        fullWidth
                                    >
                                        {submitting ? 'Processing...' : 'Approve Goal'}
                                    </Button>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid2>
            </Grid2>
        </Box>
    );
};

export default GoalReview;