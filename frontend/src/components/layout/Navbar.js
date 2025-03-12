import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Box,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Container
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };
  
  const handleSettings = () => {
    handleClose();
    navigate('/settings');
  };
  
  return (
    <AppBar position="static" elevation={1}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          {/* Logo and title */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isMobile && user && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                textDecoration: 'none',
                color: 'inherit',
                fontWeight: 700,
                letterSpacing: '.1rem',
              }}
            >
              GainSight FX
            </Typography>
          </Box>
          
          {/* User menu or login/register buttons */}
          <Box>
            {user ? (
              <>
                {/* User is logged in */}
                <IconButton
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  color="inherit"
                >
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
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
                  <MenuItem disabled>
                    <Typography variant="body2" color="textSecondary">
                      {user.email}
                    </Typography>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleSettings}>
                    <ListItemIcon>
                      <SettingsIcon fontSize="small" />
                    </ListItemIcon>
                    Settings
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                {/* User is not logged in */}
                <Button color="inherit" component={Link} to="/login">
                  Login
                </Button>
                <Button variant="outlined" color="inherit" component={Link} to="/register" sx={{ ml: 1 }}>
                  Register
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
      
      {/* Mobile Drawer */}
      {user && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
          }}
        >
          <Box
            sx={{ width: 240 }}
            role="presentation"
            onClick={handleDrawerToggle}
            onKeyDown={handleDrawerToggle}
          >
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', mr: 2 }}>
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" noWrap>
                  {user.full_name || 'User'}
                </Typography>
                <Typography variant="body2" color="textSecondary" noWrap>
                  {user.email}
                </Typography>
              </Box>
            </Box>
            <Divider />
            <List>
              <ListItem button component={Link} to="/dashboard">
                <ListItemIcon>
                  <span className="material-icons">dashboard</span>
                </ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItem>
              <ListItem button component={Link} to="/currencies">
                <ListItemIcon>
                  <span className="material-icons">currency_exchange</span>
                </ListItemIcon>
                <ListItemText primary="Currencies" />
              </ListItem>
              <ListItem button component={Link} to="/transactions">
                <ListItemIcon>
                  <span className="material-icons">swap_horiz</span>
                </ListItemIcon>
                <ListItemText primary="Transactions" />
              </ListItem>
              <ListItem button component={Link} to="/alerts">
                <ListItemIcon>
                  <span className="material-icons">notifications</span>
                </ListItemIcon>
                <ListItemText primary="Alerts" />
              </ListItem>
              <ListItem button component={Link} to="/analytics">
                <ListItemIcon>
                  <span className="material-icons">analytics</span>
                </ListItemIcon>
                <ListItemText primary="Analytics" />
              </ListItem>
              <Divider />
              <ListItem button component={Link} to="/settings">
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </ListItem>
              <ListItem button onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItem>
            </List>
          </Box>
        </Drawer>
      )}
    </AppBar>
  );
};

export default Navbar;