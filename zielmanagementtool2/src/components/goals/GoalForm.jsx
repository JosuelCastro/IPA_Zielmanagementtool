import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
    Box,
    TextField,
    Button,
    MenuItem,
    Alert,
    Paper,
    Typography,
    Grid
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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

const GoalForm = () => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { currentUser, userProfile } = useAuth();

    const formik = useFormik({
        initialValues: {
            title: '',
            description: '',
            category: '',
            startDate: null,
            endDate: null,
            status: 'planned'
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
                setLoading(true);

                await addDoc(collection(db, 'goals'), {
                    title: values.title,
                    description: values.description,
                    category: values.category,
                    startDate: values.startDate,
                    endDate: values.endDate,
                    status: values.status,
                    apprenticeId: currentUser.uid,
                    apprenticeName: `${userProfile.firstName} ${userProfile.lastName}`,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    submitted: false,
                    approved: false,
                    rating: 0,
                    comments: []
                });

                navigate('/goals');
            } catch (err) {
                setError('Failed to create goal. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    });

    return (
        <Paper elevation={2} sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
                Create New Goal
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box component="form" onSubmit={formik.handleSubmit}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
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
                    </Grid>

                    <Grid item xs={12}>
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
                    </Grid>

                    <Grid item xs={12} sm={6}>
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
                    </Grid>

                    <Grid item xs={12} sm={6}>
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
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Start Date"
                                value={formik.values.startDate}
                                onChange={(value) => {
                                    formik.setFieldValue('startDate', value);
                                }}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        id: "startDate",
                                        name: "startDate",
                                        error: formik.touched.startDate && Boolean(formik.errors.startDate),
                                        helperText: formik.touched.startDate && formik.errors.startDate,
                                        onBlur: formik.handleBlur
                                    }
                                }}
                            />
                        </LocalizationProvider>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="End Date"
                                minDate={formik.values.startDate}
                                value={formik.values.endDate}
                                onChange={(value) => {
                                    formik.setFieldValue('endDate', value);
                                }}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        id: "endDate",
                                        name: "endDate",
                                        error: formik.touched.endDate && Boolean(formik.errors.endDate),
                                        helperText: formik.touched.endDate && formik.errors.endDate,
                                        onBlur: formik.handleBlur
                                    }
                                }}
                            />
                        </LocalizationProvider>
                    </Grid>

                    <Grid item xs={12} sx={{ mt: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Goal'}
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </Paper>
    );
};

export default GoalForm;