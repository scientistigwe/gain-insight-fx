import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import NotificationsIcon from "@mui/icons-material/Notifications";
import InsightsIcon from "@mui/icons-material/Insights";
import SettingsIcon from "@mui/icons-material/Settings";
import PeopleIcon from "@mui/icons-material/People";
import ListAltIcon from "@mui/icons-material/ListAlt";
import { useAuth } from "../../hooks/useAuth";

// Drawer width
const drawerWidth = 240;

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // If on mobile, the sidebar is handled by the Navbar component
  if (isMobile) {
    return null;
  }

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/dashboard",
    },
    {
      text: "Currencies",
      icon: <CurrencyExchangeIcon />,
      path: "/currencies",
    },
    {
      text: "Transactions",
      icon: <SwapHorizIcon />,
      path: "/transactions",
    },
    {
      text: "Alerts",
      icon: <NotificationsIcon />,
      path: "/alerts",
    },
    {
      text: "Analytics",
      icon: <InsightsIcon />,
      path: "/analytics",
    },
    {
      text: "Settings",
      icon: <SettingsIcon />,
      path: "/settings",
    },
  ];

  const adminItems = [
    {
      text: "Users",
      icon: <PeopleIcon />,
      path: "/admin/users",
    },
    {
      text: "Audit Logs",
      icon: <ListAltIcon />,
      path: "/admin/audit-logs",
    },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        display: { xs: "none", sm: "block" },
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          borderRight: `1px solid ${theme.palette.divider}`,
          boxShadow: "none",
          top: "64px", // AppBar height
          height: "calc(100% - 64px)",
        },
      }}
    >
      <Box sx={{ overflow: "auto", mt: 1 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              component={Link}
              to={item.path}
              selected={isActive(item.path)}
              sx={{
                "&.Mui-selected": {
                  backgroundColor: "rgba(25, 118, 210, 0.08)",
                  "&:hover": {
                    backgroundColor: "rgba(25, 118, 210, 0.12)",
                  },
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: "4px",
                    backgroundColor: theme.palette.primary.main,
                  },
                },
                borderRadius: "0 8px 8px 0",
                my: 0.5,
                mx: 1,
                px: 1.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: isActive(item.path)
                    ? theme.palette.primary.main
                    : "inherit",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: isActive(item.path) ? 500 : 400,
                }}
              />
            </ListItem>
          ))}
        </List>

        {user && user.is_admin && (
          <>
            <Divider sx={{ mx: 2, my: 1 }} />
            <List>
              <ListItem sx={{ px: 3, py: 0.5 }}>
                <ListItemText
                  primary="Admin"
                  primaryTypographyProps={{
                    variant: "caption",
                    color: "text.secondary",
                    fontWeight: 500,
                  }}
                />
              </ListItem>
              {adminItems.map((item) => (
                <ListItem
                  button
                  key={item.text}
                  component={Link}
                  to={item.path}
                  selected={isActive(item.path)}
                  sx={{
                    "&.Mui-selected": {
                      backgroundColor: "rgba(25, 118, 210, 0.08)",
                      "&:hover": {
                        backgroundColor: "rgba(25, 118, 210, 0.12)",
                      },
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        left: 0,
                        top: 0,
                        height: "100%",
                        width: "4px",
                        backgroundColor: theme.palette.primary.main,
                      },
                    },
                    borderRadius: "0 8px 8px 0",
                    my: 0.5,
                    mx: 1,
                    px: 1.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isActive(item.path)
                        ? theme.palette.primary.main
                        : "inherit",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive(item.path) ? 500 : 400,
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar;
