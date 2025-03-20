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
    Divider,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    Assignment as AssignmentIcon,
    People as PeopleIcon,
    AccountCircle as AccountIcon,
    ExitToApp as LogoutIcon,
    Notifications as NotificationsDrawerIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext.jsx';
import NotificationIcon from '../notifications/NotificationIcon';
import NotificationsPopup from '../notifications/NotificationsPopup';

const Header = () => {
    const { currentUser, userProfile, logout } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [anchorEl, setAnchorEl] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
    const [mobileNotificationsOpen, setMobileNotificationsOpen] = useState(false);

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
        if (isMobile) {
            setMobileNotificationsOpen(true);
        } else {
            setNotificationsAnchorEl(event.currentTarget);
        }
    };

    const handleNotificationsClose = () => {
        setNotificationsAnchorEl(null);
        setMobileNotificationsOpen(false);
    };

    const handleNavigateAndCloseDrawer = (path) => {
        navigate(path);
        setDrawerOpen(false);
    };

    const drawerItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, onClick: () => handleNavigateAndCloseDrawer('/dashboard') },
        ...(userProfile?.role === 'apprentice'
                ? [{ text: 'My Goals', icon: <AssignmentIcon />, onClick: () => handleNavigateAndCloseDrawer('/goals') }]
                : [{ text: 'Apprentices', icon: <PeopleIcon />, onClick: () => handleNavigateAndCloseDrawer('/apprentices') }]
        ),
        { text: 'Leaderboard', icon: <PeopleIcon />, onClick: () => handleNavigateAndCloseDrawer('/leaderboard') }
    ];

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar sx={{ borderRadius: 0 }} position="static">
                <Toolbar>
                    {currentUser && (
                        <IconButton
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}

                    {/* Logo and App Title Container */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexGrow: 1
                    }}>
                        {/* Cognizant Logo */}
                        <RouterLink to="/" style={{
                            display: 'flex',
                            alignItems: 'center',
                            textDecoration: 'none',
                            color: 'inherit'
                        }}>
                            <Box
                                component="img"
                                src="/Cognizant.png"
                                alt="Cognizant Logo"
                                sx={{
                                    height: { xs: 48, sm: 64 },
                                    mr: 1,
                                    display: 'block'
                                }}
                            />
                        </RouterLink>
                    </Box>

                    {currentUser ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {/* Navigation buttons - only show on larger screens */}
                            <Box sx={{ display: { xs: 'none', md: 'flex' }, mr: 2 }}>
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

                            {/* Notification Icon - only show on larger screens */}
                            {!isMobile && (
                                <NotificationIcon onClick={handleNotificationsOpen} />
                            )}

                            {/* User Avatar - only show on larger screens */}
                            {!isMobile && (
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
                            )}

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

                            {/* Notifications Popup - only for desktop */}
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
                >
                    {/* User Profile in drawer header */}
                    <Box sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
                    }}>
                        <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                            {userProfile?.firstName?.charAt(0) || ''}
                            {userProfile?.lastName?.charAt(0) || ''}
                        </Avatar>
                        <Typography variant="subtitle1">
                            {userProfile?.firstName} {userProfile?.lastName}
                        </Typography>
                    </Box>

                    <List>
                        {drawerItems.map((item) => (
                            <ListItem
                                button
                                key={item.text}
                                onClick={item.onClick}
                            >
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItem>
                        ))}
                    </List>

                    <Divider />

                    {/* Added Notifications to drawer */}
                    <List>
                        <ListItem button onClick={() => {
                            setDrawerOpen(false);
                            handleNotificationsOpen();
                        }}>
                            <ListItemIcon><NotificationsDrawerIcon /></ListItemIcon>
                            <ListItemText primary="Notifications" />
                        </ListItem>
                        <ListItem button onClick={() => {
                            setDrawerOpen(false);
                            navigate('/profile');
                        }}>
                            <ListItemIcon><AccountIcon /></ListItemIcon>
                            <ListItemText primary="Profile" />
                        </ListItem>
                        <ListItem button onClick={() => {
                            setDrawerOpen(false);
                            handleLogout();
                        }}>
                            <ListItemIcon><LogoutIcon /></ListItemIcon>
                            <ListItemText primary="Logout" />
                        </ListItem>
                    </List>
                </Box>
            </Drawer>

            {/* Mobile Notifications (full-screen or as a modal) */}
            {isMobile && (
                <NotificationsPopup
                    open={mobileNotificationsOpen}
                    onClose={handleNotificationsClose}
                    fullScreen={true}
                />
            )}
        </Box>
    );
};

export default Header;