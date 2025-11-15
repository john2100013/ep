import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  ExitToApp as LogoutIcon,
  Receipt as InvoiceIcon,
  Description as QuotationIcon,
  Inventory as ItemsIcon,
  Settings as SettingsIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { user, business, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppBar position="static" sx={{ bgcolor: '#0066ff' }}>
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          Invoice App
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button 
            color="inherit" 
            startIcon={<InvoiceIcon />}
            onClick={() => navigate('/invoices')}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            Invoices
          </Button>
          
          <Button 
            color="inherit" 
            startIcon={<QuotationIcon />}
            onClick={() => navigate('/quotations')}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            Quotations
          </Button>
          
          <Button 
            color="inherit" 
            startIcon={<ItemsIcon />}
            onClick={() => navigate('/items-list')}
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            Items
          </Button>

          <Button 
            color="inherit" 
            startIcon={<AccountBalanceIcon />}
            onClick={() => navigate('/financial-accounts')}
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            Accounts
          </Button>

          <Button 
            color="inherit" 
            startIcon={<SettingsIcon />}
            onClick={() => navigate('/business-settings')}
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            Settings
          </Button>

          {business && (
            <Typography variant="body2" sx={{ display: { xs: 'none', lg: 'block' }, ml: 2 }}>
              {business.name}
            </Typography>
          )}
          
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <AccountIcon />
          </IconButton>
          
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
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
            <MenuItem disabled>
              <Box>
                <Typography variant="subtitle2">
                  {user?.first_name} {user?.last_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;