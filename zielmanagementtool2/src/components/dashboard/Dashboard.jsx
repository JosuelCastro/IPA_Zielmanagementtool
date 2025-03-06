import { Box } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
    const { userProfile } = useAuth();

    return (
        <Box>
            Hallo Welt
        </Box>
    );
};

export default Dashboard;