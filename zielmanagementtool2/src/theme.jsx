import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            // Midnight blue from the color guidelines
            main: '#000048', // Pantone 281 C
            light: '#2F78C4', // Medium blue - Pantone 278 C
            dark: '#000048', // Dark blue - same as main for consistency
            contrastText: '#FFFFFF',
        },
        secondary: {
            // Dark plum from the color guidelines
            main: '#2E308E', // Pantone Violet C
            light: '#737308', // Medium plum - Pantone 2665 C
            dark: '#2E308E', // Dark plum - same as main for consistency
            contrastText: '#FFFFFF',
        },
        error: {
            // Highlight red
            main: '#B81F2D', // Highlight red - Pantone Red
            light: '#dd3948',
            dark: '#8c0e1a',
            contrastText: '#FFFFFF',
        },
        warning: {
            // Highlight yellow
            main: '#E9C71D', // Highlight yellow - Pantone Yellow
            light: '#f0d453',
            dark: '#b09704',
            contrastText: '#000000',
        },
        info: {
            // Light blue
            main: '#92BBE6', // Light blue - Pantone 278 C
            light: '#a7c8eb',
            dark: '#6f97c2',
            contrastText: '#000000',
        },
        success: {
            // Medium teal
            main: '#06C7CC', // Medium teal - Pantone 3262 C
            light: '#3ad2d6',
            dark: '#039a9e',
            contrastText: '#000000',
        },
        text: {
            primary: '#000000',
            secondary: '#535656', // Dark gray - Cool gray 11 C
            disabled: '#979999', // Medium gray - Cool gray 7 C
        },
        background: {
            default: '#F5F5F5',
            paper: '#FFFFFF',
        },
        grey: {
            50: '#FAFAFA',
            100: '#F5F5F5',
            200: '#EEEEEE',
            300: '#E0E0E0',
            400: '#BDBDBD',
            500: '#9E9E9E',
            600: '#757575',
            700: '#616161',
            800: '#424242',
            900: '#212121',
            A100: '#D5D5D5',
            A200: '#AAAAAA',
            A400: '#616161',
            A700: '#303030',
        },
    },
    typography: {
        fontFamily: [
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
        ].join(','),
        h1: {
            fontWeight: 500,
            fontSize: '2.5rem',
        },
        h2: {
            fontWeight: 500,
            fontSize: '2rem',
        },
        h3: {
            fontWeight: 500,
            fontSize: '1.75rem',
        },
        h4: {
            fontWeight: 500,
            fontSize: '1.5rem',
        },
        h5: {
            fontWeight: 500,
            fontSize: '1.25rem',
        },
        h6: {
            fontWeight: 500,
            fontSize: '1rem',
        },
    },
    components: {
        MuiSvgIcon: {
            styleOverrides: {
                // Make all icons midnight blue by default for better visibility
                root: {
                    color: '#000048', // Midnight blue for all icons
                },
                colorPrimary: {
                    color: '#000048', // Midnight blue
                },
                colorSecondary: {
                    color: '#2E308E', // Dark plum
                },
                colorAction: {
                    color: '#000048', // Midnight blue
                },
                colorDisabled: {
                    color: '#979999', // Medium gray
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    color: '#000048', // Midnight blue for icon buttons
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 72, 0.04)', // Very light midnight blue for hover
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 4,
                    textTransform: 'none',
                    fontWeight: 500,
                },
                containedPrimary: {
                    backgroundColor: '#000048', // Midnight blue
                    '&:hover': {
                        backgroundColor: '#0000B2', // Slightly lighter midnight blue for hover
                    },
                },
                outlinedPrimary: {
                    borderColor: '#000048', // Midnight blue
                    color: '#000048',
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 72, 0.04)', // Very light midnight blue for hover
                    },
                },
                // Ensure icons inside buttons maintain visibility with the right color
                startIcon: {
                    '& .MuiSvgIcon-root': {
                        color: 'inherit', // Inherit color from button
                    },
                },
                endIcon: {
                    '& .MuiSvgIcon-root': {
                        color: 'inherit', // Inherit color from button
                    },
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#000048', // Midnight blue
                },
                colorPrimary: {
                    '& .MuiSvgIcon-root': {
                        color: '#FFFFFF', // White icons on dark app bar for contrast
                    },
                    '& .MuiIconButton-root': {
                        color: '#FFFFFF', // White icon buttons on dark app bar
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                filledPrimary: {
                    backgroundColor: '#000048', // Midnight blue
                },
                outlinedPrimary: {
                    borderColor: '#000048', // Midnight blue
                    color: '#000048',
                },
                icon: {
                    color: 'inherit', // Inherit color from chip
                },
                deleteIcon: {
                    color: 'inherit', // Inherit color from chip with some opacity
                    opacity: 0.7,
                    '&:hover': {
                        opacity: 1,
                    },
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                indicator: {
                    backgroundColor: '#000048', // Midnight blue
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    '&.Mui-selected': {
                        color: '#000048', // Midnight blue
                    },
                    '& .MuiSvgIcon-root': {
                        marginBottom: 0,
                        marginRight: 6,
                    },
                },
            },
        },
        MuiListItemIcon: {
            styleOverrides: {
                root: {
                    color: '#000048', // Midnight blue for list item icons
                    minWidth: 40, // Slightly reduced for better spacing
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
                elevation1: {
                    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
                },
                elevation2: {
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.12)',
                },
                elevation3: {
                    boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.14)',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    '& .MuiListItemIcon-root': {
                        color: '#000048', // Ensure drawer icons are visible
                    },
                },
            },
        },
        MuiBadge: {
            styleOverrides: {
                badge: {
                    fontWeight: 'bold',
                },
            },
        },
    },
});

export default theme;