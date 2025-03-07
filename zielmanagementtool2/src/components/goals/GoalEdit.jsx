import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
    Box,
    TextField,
    Button,
    MenuItem,
    Alert,
    Grid2,
    Paper,
    Typography,
    CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/lab';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';

const categories = [
    { value: 'technical', label: 'Technical Skills' },
    { value: 'soft', label: 'Soft Skills' },
    { value: 'education', label: 'Education & Training' },
    { value: 'project', label: 'Project Delivery' }
];

const statusOptions = [
    { value: 'planned', label: 'Planned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
];

const GoalEdit = () => {
    const { goalId } = useParams();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const formik = useFormik({
        initialValues: {
            title: '',
            description: '',
            category: '',
            startDate: null,
            endDate: null,
            status: ''
        },
        validationSchema: Yup.object({
            title: Yup.string()
                .required('Title is required')
                .max(100, 'Title should be at most 100 characters'),
            description: Yup.string()
                .required('Description is required'),
            category: Yup.string()
                .required('Category is required'),
            startDate: Yup.date()
                .required('Start date is required')
                .nullable(),
            endDate: Yup.date()
                .required('End date is required')
                .min(Yup.ref('startDate'), 'End date must be after start date')
                .nullable(),
            status: Yup.string()
                .required('Status is required')
        }),
        onSubmit: async (values) => {
            try {
                setError('');
                setSaving(true);

                await updateDoc(doc(db, 'goals', goalId), {
                    title: values.title,
                    description: values.description,
                    category: values.category,
                    startDate: values.startDate,
                    endDate: values.endDate,
                    status: values.status,
                    updatedAt: serverTimestamp()
                });

                navigate(`/goals/${goalId}`);
            } catch (err) {
                setError('Failed to update goal. Please try again.');
                console.error(err);
            } finally {
                setSaving(false);
            }
        }
    });

    useEffect(() => {
        const fetchGoal = async () => {
            try {
                const goalDoc = await getDoc(doc(db, 'goals', goalId));

                if (!goalDoc.exists()) {
                    setError('Goal not found');
                    setLoading(false);
                    return;
                }

                const goalData = goalDoc.data();

                // Check if goal belongs to current user
                if (goalData.apprenticeId !== currentUser.uid) {
                    setError('You do not have permission to edit this goal');
                    setLoading(false);
                    return;
                }

                // Check if goal is already submitted
                if (goalData.submitted) {
                    setError('This goal has already been submitted and cannot be edited');
                    setLoading(false);
                    return;
                }

                // Set form values
                formik.setValues({
                    title: goalData.title,
                    description: goalData.description,
                    category: goalData.category,
                    startDate: goalData.startDate?.toDate() || null,
                    endDate: goalData.endDate?.toDate() || null,
                    status: goalData.status
                });

                setLoading(false);
            } catch (err) {
                console.error('Error fetching goal:', err);
                setError('Failed to load goal details. Please try again later.');
                setLoading(false);
            }
        };

        fetchGoal();
    }, [goalId, currentUser.uid, formik.setValues]);

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
                    onClick={() => navigate('/goals')}
                    variant="outlined"
                    sx={{ mt: 2 }}
                >
                    Back to Goals
                </Button>
            </Box>
        );
    }

    return (
        <Paper elevation={2} sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
                Edit Goal
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box component="form" onSubmit={formik.handleSubmit}>
                <Grid2 container spacing={2}>
                    <Grid2 item xs={12}>
                        <TextField
                            fullWidth
                            id="title"
                            name="title"
                            label="Goal Title"
                            value={formik.values.title}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.title && Boolean(formik.errors.title)}
                            helperText={formik.touched.title && formik.errors.title}
                        />
                    </Grid2>

                    <Grid2 item xs={12}>
                        <TextField
                            fullWidth
                            id="description"
                            name="description"
                            label="Description"
                            multiline
                            rows={4}
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.description && Boolean(formik.errors.description)}
                            helperText={formik.touched.description && formik.errors.description}
                        />
                    </Grid2>

                    <Grid2 item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            select
                            id="category"
                            name="category"
                            label="Category"
                            value={formik.values.category}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.category && Boolean(formik.errors.category)}
                            helperText={formik.touched.category && formik.errors.category}
                        >
                            {categories.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid2>

                    <Grid2 item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            select
                            id="status"
                            name="status"
                            label="Status"
                            value={formik.values.status}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.status && Boolean(formik.errors.status)}
                            helperText={formik.touched.status && formik.errors.status}
                        >
                            {statusOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid2>

                    <Grid2 item xs={12} sm={6}>
                        <DatePicker
                            label="Start Date"
                            value={formik.values.startDate}
                            onChange={(value) => formik.setFieldValue('startDate', value)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    fullWidth
                                    id="startDate"
                                    name="startDate"
                                    error={formik.touched.startDate && Boolean(formik.errors.startDate)}
                                    helperText={formik.touched.startDate && formik.errors.startDate}
                                />
                            )}
                        />
                    </Grid2>

                    <Grid2 item xs={12} sm={6}>
                        <DatePicker
                            label="End Date"
                            minDate={formik.values.startDate}
                            value={formik.values.endDate}
                            onChange={(value) => formik.setFieldValue('endDate', value)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    fullWidth
                                    id="endDate"
                                    name="endDate"
                                    error={formik.touched.endDate && Boolean(formik.errors.endDate)}
                                    helperText={formik.touched.endDate && formik.errors.endDate}
                                />
                            )}
                        />
                    </Grid2>

                    <Grid2 item xs={12} sx={{ mt: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => navigate(`/goals/${goalId}`)}
                            sx={{ mt: 2 }}
                        >
                            Cancel
                        </Button>
                    </Grid2>
                </Grid2>
            </Box>
        </Paper>
    );
};

export default GoalEdit;