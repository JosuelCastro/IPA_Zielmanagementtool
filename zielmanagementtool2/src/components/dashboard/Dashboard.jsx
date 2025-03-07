import { Box } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import ApprenticeDashboard from './ApprenticeDashboard';
import SupervisorDashboard from './SupervisorDashboard';

const Dashboard = () => {
    const { userProfile } = useAuth();

    return (
        <Box>
            {userProfile?.role === 'supervisor' ? (
                <SupervisorDashboard />
            ) : (
                <ApprenticeDashboard />
            )}
        </Box>
    );
};

export default Dashboard;