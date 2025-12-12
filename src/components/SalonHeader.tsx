import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Avatar,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  ExitToApp as LogoutIcon,
  Dashboard as DashboardIcon,
  PointOfSale as POSIcon,
  People as PeopleIcon,
  ContentCut as ServicesIcon,
  Inventory as ProductsIcon,
  AccessTime as ShiftsIcon,
  TrendingUp as PerformanceIcon,
  Assessment as ReportsIcon,
  Menu as MenuIcon,
  StorefrontOutlined as ShopIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SalonHeaderProps {
  title?: string;
}

const SalonHeader: React.FC<SalonHeaderProps> = ({ title = 'Salon/Barber' }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileDrawerOpen(false);
  };

  const navigationItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/salon' },
    { label: 'POS', icon: <POSIcon />, path: '/salon/pos' },
    { label: 'Employees', icon: <PeopleIcon />, path: '/salon/employees' },
    { label: 'Services', icon: <ServicesIcon />, path: '/salon/services' },
    { label: 'Products', icon: <ProductsIcon />, path: '/salon/products' },
    { label: 'Shifts', icon: <ShiftsIcon />, path: '/salon/shifts' },
    { label: 'Performance', icon: <PerformanceIcon />, path: '/salon/performance' },
    { label: 'Reports', icon: <ReportsIcon />, path: '/salon/reports' },
  ];

  const isActivePath = (path: string) => {
    if (path === '/salon') {
      return location.pathname === '/salon';
    }
    return location.pathname.startsWith(path);
  };

  if (!isAuthenticated) {
    return null;
  }

  // Get user initials for avatar
  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <>
      {/* Main AppBar */}
      <AppBar
        position="sticky"
        sx={{
          background: 'linear-gradient(135deg, #0066ff 0%, #0052cc 100%)',
          boxShadow: '0 2px 8px rgba(0, 102, 255, 0.15)',
          zIndex: 1200,
        }}
      >
        <Container maxWidth="lg" sx={{ width: '100%' }}>
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 2, minHeight: 100 }}>
            {/* Left Section - Logo and Title */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Mobile Menu Icon */}
              {isMobile && (
                <IconButton
                  color="inherit"
                  onClick={() => setMobileDrawerOpen(true)}
                  sx={{ mr: 1 }}
                >
                  <MenuIcon />
                </IconButton>
              )}

              {/* Logo/Brand */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  },
                }}
                onClick={() => navigate('/salon')}
              >
                <ShopIcon sx={{ fontSize: 40, color: 'white' }} />
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: 'white',
                      fontSize: { xs: '1.1rem', sm: '1.25rem' },
                      lineHeight: 1.2,
                    }}
                  >
                    {title}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Center Section - Navigation (Desktop) */}
            {!isMobile && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  alignItems: 'center',
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  maxWidth: '60%',
                  mx: 2,
                  scrollBehavior: 'smooth',
                  '&::-webkit-scrollbar': {
                    height: '4px',
                  },
                  '&::-webkit-scrollbar-track': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '2px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: '2px',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.5)',
                    },
                  },
                }}
              >
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', whiteSpace: 'nowrap' }}>
                  {navigationItems.map((item) => (
                    <Button
                      key={item.path}
                      color="inherit"
                      startIcon={item.icon}
                      onClick={() => navigate(item.path)}
                      sx={{
                        fontSize: '1rem',
                        textTransform: 'none',
                        fontWeight: isActivePath(item.path) ? 700 : 600,
                        px: 2,
                        py: 1,
                        borderRadius: 1.5,
                        flexShrink: 0,
                        transition: 'all 0.2s',
                        bgcolor: isActivePath(item.path) ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                          transform: 'translateY(-3px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        },
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </Box>
              </Box>
            )}

            {/* Right Section - User Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
              {/* User Avatar Menu */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flexShrink: 0,
                }}
              >
                <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right', minWidth: 'max-content' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user?.first_name} {user?.last_name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      display: 'block',
                      fontSize: '0.75rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 200,
                    }}
                  >
                    {user?.email}
                  </Typography>
                </Box>

                <IconButton
                  size="small"
                  onClick={handleMenu}
                  sx={{
                    p: 0.5,
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.25)',
                      border: '2px solid rgba(255, 255, 255, 0.5)',
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: 'rgba(255, 255, 255, 0.3)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '1rem',
                    }}
                  >
                    {initials}
                  </Avatar>
                </IconButton>
              </Box>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* User Menu Dropdown */}
      <Menu
        id="salon-header-user-menu"
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
        PaperProps={{
          sx: {
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            borderRadius: 1.5,
            minWidth: 250,
            mt: 1,
          },
        }}
      >
        {/* User Info Section */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {user?.first_name} {user?.last_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Back to Main Dashboard */}
        <MenuItem
          onClick={() => {
            navigate('/dashboard');
            handleClose();
          }}
          sx={{
            py: 1,
            '&:hover': {
              bgcolor: '#f5f5f5',
            },
          }}
        >
          <ListItemIcon>
            <DashboardIcon fontSize="small" sx={{ color: '#0066ff' }} />
          </ListItemIcon>
          <ListItemText>Main Dashboard</ListItemText>
        </MenuItem>

        {/* Settings Option */}
        <MenuItem
          onClick={() => {
            navigate('/business-settings');
            handleClose();
          }}
          sx={{
            py: 1,
            '&:hover': {
              bgcolor: '#f5f5f5',
            },
          }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" sx={{ color: '#0066ff' }} />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>

        <Divider sx={{ my: 1 }} />

        {/* Logout Option */}
        <MenuItem
          onClick={handleLogout}
          sx={{
            py: 1,
            color: '#d32f2f',
            '&:hover': {
              bgcolor: '#ffebee',
            },
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" sx={{ color: '#d32f2f' }} />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: '80%',
            maxWidth: 300,
          },
        }}
      >
        <Box sx={{ width: '100%', py: 2 }}>
          {/* Drawer Header */}
          <Box sx={{ px: 2, py: 2, borderBottom: '1px solid #eee' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0066ff' }}>
              {title}
            </Typography>
          </Box>

          {/* Navigation List */}
          <List>
            {navigationItems.map((item) => (
              <ListItem
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                component="button"
                sx={{
                  py: 1.5,
                  px: 2,
                  borderLeft: isActivePath(item.path) ? '3px solid #0066ff' : '3px solid transparent',
                  cursor: 'pointer',
                  background: isActivePath(item.path) ? 'rgba(0, 102, 255, 0.05)' : 'none',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                  '&:hover': {
                    bgcolor: 'rgba(0, 102, 255, 0.05)',
                    borderLeftColor: '#0066ff',
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActivePath(item.path) ? '#0066ff' : '#666', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.95rem',
                    fontWeight: isActivePath(item.path) ? 600 : 500,
                    color: isActivePath(item.path) ? '#0066ff' : 'inherit',
                  }}
                />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          {/* User Info and Logout */}
          <Box sx={{ px: 2, py: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {user?.first_name} {user?.last_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="outlined"
              color="error"
              size="small"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Logout
            </Button>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default SalonHeader;

