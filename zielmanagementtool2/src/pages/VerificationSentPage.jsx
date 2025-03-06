import { Box, Typography, Paper, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import EmailIcon from '@mui/icons-material/Email';

const VerificationSentPage = () => {
    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '70vh'
        }}>
            <Paper sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
                <EmailIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                    Verification Email Sent
                </Typography>
                <Typography variant="body1" paragraph>
                    We've sent a verification email to your inbox. Please check your email and click the verification link to activate your account.
                </Typography>
                <Typography variant="body2" paragraph color="text.secondary">
                    If you don't see the email, check your spam folder or request a new verification link.
                </Typography>
                <Button
                    variant="contained"
                    component={RouterLink}
                    to="/login"
                    fullWidth
                    sx={{ mt: 2 }}
                >
                    Return to Login
                </Button>
            </Paper>
        </Box>
    );
};

export default VerificationSentPage;