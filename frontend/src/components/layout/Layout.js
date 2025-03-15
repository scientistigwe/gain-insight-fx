import React from "react";
import { Outlet } from "react-router-dom";
import {
  Box,
  Container,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useAuth } from "../../context/AppProvider"; // Changed import path

const Layout = () => {
  const { currentUser, loading } = useAuth(); // Changed from user to currentUser
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // If user is logged in, show the dashboard layout with sidebar
  const isAuthenticated = !!currentUser; // Changed from user to currentUser

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />

      <Box sx={{ display: "flex", flex: 1 }}>
        {isAuthenticated && !isMobile && <Sidebar />}

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            ml: isAuthenticated && !isMobile ? "240px" : 0,
            transition: theme.transitions.create(["margin", "width"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}
        >
          {/* Add some space to account for the app bar */}
          <Box sx={{ height: theme.spacing(7), mb: 2 }} />
          <Container maxWidth="xl">
            <Outlet />
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;