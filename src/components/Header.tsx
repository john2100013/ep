import React, { useState, useEffect } from 'react';
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
  Chip,
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  ExitToApp as LogoutIcon,
  Receipt as InvoiceIcon,
  Description as QuotationIcon,
  Inventory as ItemsIcon,
  Settings as SettingsIcon,
  AccountBalance as AccountBalanceIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AssignmentReturn as GoodsReturnIcon,
  ErrorOutline as DamageIcon,
  BarChart as AnalyticsIcon,
  StorefrontOutlined as ShopIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = 'Invoice App' }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [businessEmail, setBusinessEmail] = useState<string>('');
  const { user, business, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Fetch business settings to get business email
  useEffect(() => {
    const fetchBusinessSettings = async () => {
      try {
        const response = await fetch('https://erp-backend-beryl.vercel.app/api/business-settings', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.email) {
            setBusinessEmail(data.data.email);
          }
        }
      } catch (error) {
        console.error('Error fetching business settings:', error);
        // Fallback to localStorage
        const savedSettings = localStorage.getItem('businessSettings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          if (settings.email) {
            setBusinessEmail(settings.email);
          }
        }
      }
    };

    if (isAuthenticated) {
      fetchBusinessSettings();
    }
  }, [isAuthenticated]);

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
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { label: 'Invoices', icon: <InvoiceIcon />, path: '/invoices' },
    { label: 'Quotations', icon: <QuotationIcon />, path: '/quotations' },
    { label: 'Items', icon: <ItemsIcon />, path: '/items-list' },
    { label: 'Accounts', icon: <AccountBalanceIcon />, path: '/financial-accounts' },
    { label: 'Goods Return', icon: <GoodsReturnIcon />, path: '/goods-return' },
    { label: 'Damage Tracking', icon: <DamageIcon />, path: '/damage-tracking' },
    { label: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
    { label: 'Settings', icon: <SettingsIcon />, path: '/business-settings' },
  ];

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
                onClick={() => navigate('/')}
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
                        fontWeight: 600,
                        px: 2,
                        py: 1,
                        borderRadius: 1.5,
                        flexShrink: 0,
                        transition: 'all 0.2s',
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
                    {businessEmail || user?.email}
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
        id="header-user-menu"
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
                  borderLeft: '3px solid transparent',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                  '&:hover': {
                    bgcolor: 'rgba(0, 102, 255, 0.05)',
                    borderLeftColor: '#0066ff',
                  },
                }}
              >
                <ListItemIcon sx={{ color: '#0066ff', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.95rem',
                    fontWeight: 500,
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

export default Header;
