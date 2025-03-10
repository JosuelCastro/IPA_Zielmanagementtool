import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Chip,
    Button,
    Divider,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    Rating,
    List,
    ListItem,
    ListItemText,
    TextField, Grid2
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Upload as UploadIcon,
    Assessment as AssessmentIcon
} from '@mui/icons-material';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import {auth, db, storage} from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { createCommentNotification, createSubmissionNotification } from '../../services/notificationService';

// Helper functions for category and status are the same as in GoalList component

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

const GoalDetail = () => {
    const { goalId } = useParams();
    const navigate = useNavigate();
    const { currentUser, userProfile } = useAuth();

    const [goal, setGoal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [evidence, setEvidence] = useState([]);
    const [evidenceLoading, setEvidenceLoading] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Fetch goal data
    useEffect(() => {
        const fetchGoal = async () => {
            try {
                const goalDoc = await getDoc(doc(db, 'goals', goalId));

                if (!goalDoc.exists()) {
                    setError('Goal not found');
                    setLoading(false);
                    return;
                }

                setGoal({
                    id: goalDoc.id,
                    ...goalDoc.data()
                });

                // Fetch evidence files
                loadEvidence(currentUser.uid, goalId);

            } catch (err) {
                console.error('Error fetching goal:', err);
                setError('Failed to load goal details. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchGoal();
    }, [goalId, currentUser.uid]);

    // Function to load evidence files
    const loadEvidence = async (userId, goalId) => {
        setEvidenceLoading(true);
        try {
            const evidenceRef = ref(storage, `evidence/${userId}/${goalId}`);
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
        } finally {
            setEvidenceLoading(false);
        }
    };

    // Handle file upload
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadLoading(true);

        try {
            const fileRef = ref(storage, `evidence/${currentUser.uid}/${goalId}/${file.name}`);
            await uploadBytes(fileRef, file);

            // Reload evidence list
            loadEvidence(currentUser.uid, goalId);

        } catch (err) {
            console.error('Error uploading file:', err);
            setError('Failed to upload file. Please try again.');
        } finally {
            setUploadLoading(false);
        }
    };

    // Handle file deletion
    const handleDeleteFile = async (filePath) => {
        try {
            const fileRef = ref(storage, filePath);
            await deleteObject(fileRef);

            // Reload evidence list
            loadEvidence(currentUser.uid, goalId);

        } catch (err) {
            console.error('Error deleting file:', err);
            setError('Failed to delete file. Please try again.');
        }
    };

    // Handle goal deletion
    const handleDeleteGoal = async () => {
        if (!window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'goals', goalId));
            navigate('/goals');
        } catch (err) {
            console.error('Error deleting goal:', err);
            setError('Failed to delete goal. Please try again.');
        }
    };

    // Handle goal submission
    const handleSubmitGoal = async () => {
        if (!window.confirm('Are you sure you want to submit this goal for review? You won\'t be able to edit it after submission.')) {
            return;
        }

        setSubmitting(true);

        try {
            await updateDoc(doc(db, 'goals', goalId), {
                submitted: true,
                submittedAt: serverTimestamp()
            });

            // Create notification for all supervisors about the goal submission
            await createSubmissionNotification({
                goalId,
                apprenticeId: currentUser.uid,
                apprenticeName: `${userProfile.firstName} ${userProfile.lastName}`
            });

            // Refresh goal data
            const updatedGoal = await getDoc(doc(db, 'goals', goalId));
            setGoal({
                id: updatedGoal.id,
                ...updatedGoal.data()
            });

        } catch (err) {
            console.error('Error submitting goal:', err);
            setError('Failed to submit goal. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle adding a comment
    const handleAddComment = async () => {
        if (!commentText.trim()) return;

        setSubmitting(true);

        try {
            // Use a regular Date object instead of serverTimestamp() for the comment
            const now = new Date();

            const comment = {
                text: commentText,
                authorId: currentUser.uid,
                authorName: `${userProfile.firstName} ${userProfile.lastName}`,
                createdAt: now
            };

            await updateDoc(doc(db, 'goals', goalId), {
                comments: [...(goal.comments || []), comment],
                updatedAt: serverTimestamp()
            });

            // If apprentice is commenting, notify appropriate supervisors
            if (userProfile.role === 'apprentice') {
                // For submitted goals, createCommentNotification will handle finding recipients
                if (goal.submitted) {
                    await createCommentNotification({
                        goalId,
                        senderId: currentUser.uid,
                        senderName: `${userProfile.firstName} ${userProfile.lastName}`,
                        senderRole: 'apprentice'
                        // No specific recipientId needed - service will handle finding supervisors
                    });
                }
            } else if (userProfile.role === 'supervisor') {
                // Notify the apprentice
                await createCommentNotification({
                    goalId,
                    senderId: currentUser.uid,
                    senderName: `${userProfile.firstName} ${userProfile.lastName}`,
                    senderRole: 'supervisor',
                    recipientId: goal.apprenticeId,
                    recipientRole: 'apprentice'
                });
            }

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
                    to="/goals"
                    variant="outlined"
                    sx={{ mt: 2 }}
                >
                    Back to Goals
                </Button>
            </Box>
        );
    }

    if (!goal) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="warning">Goal not found</Alert>
                <Button
                    component={RouterLink}
                    to="/goals"
                    variant="outlined"
                    sx={{ mt: 2 }}
                >
                    Back to Goals
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        {goal.title}
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
                        />
                    </Box>
                </Box>

                <Box>
                    {!goal.submitted ? (
                        <>
                            <Button
                                variant="contained"
                                startIcon={<EditIcon />}
                                component={RouterLink}
                                to={`/goals/${goalId}/edit`}
                                sx={{ mr: 1 }}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={handleDeleteGoal}
                            >
                                Delete
                            </Button>
                        </>
                    ) : (
                        <Chip
                            label="Submitted for Review"
                            color="primary"
                        />
                    )}
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
                            {goal.submittedAt && (
                                <Grid2 item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Submitted:</strong> {format(goal.submittedAt.toDate(), 'MMMM d, yyyy')}
                                    </Typography>
                                </Grid2>
                            )}
                        </Grid2>
                    </Paper>

                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Evidence
                        </Typography>

                        {!goal.submitted && (
                            <Box sx={{ mb: 2 }}>
                                <Button
                                    variant="contained"
                                    component="label"
                                    startIcon={<UploadIcon />}
                                    disabled={uploadLoading}
                                >
                                    {uploadLoading ? 'Uploading...' : 'Upload File'}
                                    <input
                                        type="file"
                                        hidden
                                        onChange={handleFileUpload}
                                    />
                                </Button>
                            </Box>
                        )}

                        {evidenceLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                <CircularProgress size={24} />
                            </Box>
                        ) : evidence.length > 0 ? (
                            <List>
                                {evidence.map((file) => (
                                    <ListItem
                                        key={file.path}
                                        divider
                                        secondaryAction={
                                            !goal.submitted && (
                                                <Button
                                                    color="error"
                                                    onClick={() => handleDeleteFile(file.path)}
                                                >
                                                    Delete
                                                </Button>
                                            )
                                        }
                                    >
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
                                No evidence files uploaded yet.
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
                                onClick={handleAddComment}
                                disabled={!commentText.trim()}
                            >
                                Add Comment
                            </Button>
                        </Box>
                    </Paper>
                </Grid2>

                <Grid2 item xs={12} md={4}>
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Goal Status
                            </Typography>

                            {goal.approved ? (
                                <Box>
                                    <Chip label="Approved" color="success" sx={{ mb: 2 }} />
                                    <Typography variant="body2" gutterBottom>
                                        <strong>Rating:</strong>
                                    </Typography>
                                    <Rating value={goal.rating} readOnly precision={0.5} />
                                </Box>
                            ) : goal.submitted ? (
                                <Chip label="Waiting for Review" color="primary" />
                            ) : (
                                <Box>
                                    <Typography variant="body2" gutterBottom>
                                        This goal has not been submitted for review yet.
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<AssessmentIcon />}
                                        onClick={handleSubmitGoal}
                                        disabled={submitting || evidence.length === 0}
                                        fullWidth
                                        sx={{ mt: 1 }}
                                    >
                                        {submitting ? 'Submitting...' : 'Submit for Review'}
                                    </Button>
                                    {evidence.length === 0 && (
                                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                                            Please upload at least one evidence file before submitting.
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    <Button
                        variant="outlined"
                        component={RouterLink}
                        to="/goals"
                        fullWidth
                    >
                        Back to Goals
                    </Button>
                </Grid2>
            </Grid2>
        </Box>
    );
};

export default GoalDetail;