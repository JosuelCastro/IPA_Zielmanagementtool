import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    AppBar,
    Box,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Avatar,
    Drawer,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    Assignment as AssignmentIcon,
    People as PeopleIcon,
    AccountCircle as AccountIcon,
    ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext.jsx';
import NotificationIcon from '../notifications/NotificationIcon';
import NotificationsPopup from '../notifications/NotificationsPopup';

const Header = () => {
    const { currentUser, userProfile, logout } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleDrawerToggle = () => {
        setDrawerOpen(!drawerOpen);
    };

    const handleLogout = async () => {
        try {
            handleClose();
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    const handleNotificationsOpen = (event) => {
        setNotificationsAnchorEl(event.currentTarget);
    };

    const handleNotificationsClose = () => {
        setNotificationsAnchorEl(null);
    };

    const drawerItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, link: '/dashboard' },
        ...(userProfile?.role === 'apprentice'
                ? [{ text: 'My Goals', icon: <AssignmentIcon />, link: '/goals' }]
                : [{ text: 'Apprentices', icon: <PeopleIcon />, link: '/apprentices' }]
        ),
        { text: 'Leaderboard', icon: <PeopleIcon />, link: '/leaderboard' }
    ];

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    {currentUser && (
                        <IconButton
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2, display: { sm: 'none' } }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}

                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        <RouterLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                            ZielManager
                        </RouterLink>
                    </Typography>

                    {currentUser ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ display: { xs: 'none', sm: 'flex' }, mr: 2 }}>
                                <Button
                                    color="inherit"
                                    component={RouterLink}
                                    to="/dashboard"
                                >
                                    Dashboard
                                </Button>

                                {userProfile?.role === 'apprentice' && (
                                    <Button
                                        color="inherit"
                                        component={RouterLink}
                                        to="/goals"
                                    >
                                        My Goals
                                    </Button>
                                )}

                                {userProfile?.role === 'supervisor' && (
                                    <Button
                                        color="inherit"
                                        component={RouterLink}
                                        to="/apprentices"
                                    >
                                        Apprentices
                                    </Button>
                                )}
                                <Button
                                    color="inherit"
                                    component={RouterLink}
                                    to="/leaderboard"
                                >
                                    Leaderboard
                                </Button>
                            </Box>

                            {/* Notification Icon */}
                            <NotificationIcon onClick={handleNotificationsOpen} />

                            {/* User Avatar */}
                            <IconButton
                                size="large"
                                aria-label="account of current user"
                                aria-controls="menu-appbar"
                                aria-haspopup="true"
                                onClick={handleMenu}
                                color="inherit"
                            >
                                <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32, fontSize: 14 }}>
                                    {userProfile?.firstName?.charAt(0) || ''}
                                    {userProfile?.lastName?.charAt(0) || ''}
                                </Avatar>
                            </IconButton>
                            <Menu
                                id="menu-appbar"
                                anchorEl={anchorEl}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
                            >
                                <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
                                    Profile
                                </MenuItem>
                                <MenuItem onClick={handleLogout}>Logout</MenuItem>
                            </Menu>

                            {/* Notifications Popup */}
                            <NotificationsPopup
                                anchorEl={notificationsAnchorEl}
                                open={Boolean(notificationsAnchorEl)}
                                onClose={handleNotificationsClose}
                            />
                        </Box>
                    ) : (
                        <Button color="inherit" component={RouterLink} to="/login">
                            Login
                        </Button>
                    )}
                </Toolbar>
            </AppBar>

            {/* Responsive Drawer for Mobile */}
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={handleDrawerToggle}
            >
                <Box
                    sx={{ width: 250 }}
                    role="presentation"
                    onClick={handleDrawerToggle}
                >
                    <List>
                        {drawerItems.map((item) => (
                            <ListItem
                                button
                                key={item.text}
                                component={RouterLink}
                                to={item.link}
                            >
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItem>
                        ))}
                    </List>
                    <Divider />
                    <List>
                        <ListItem button component={RouterLink} to="/profile">
                            <ListItemIcon><AccountIcon /></ListItemIcon>
                            <ListItemText primary="Profile" />
                        </ListItem>
                        <ListItem button onClick={handleLogout}>
                            <ListItemIcon><LogoutIcon /></ListItemIcon>
                            <ListItemText primary="Logout" />
                        </ListItem>
                    </List>
                </Box>
            </Drawer>
        </Box>
    );
};

export default Header;