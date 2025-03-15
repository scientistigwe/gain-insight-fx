import React from "react";
import { RouterProvider } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AppProvider } from "./context/AppProvider"; // Import the combined provider
import router from "./routes";

// Import custom CSS
import "./assets/styles/main.css";

// Create a theme
const theme = createTheme({
  // Your theme configuration
});

// Wrap everything in React.StrictMode to ensure proper React initialization
const App = () => {
  return (
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppProvider>
          <RouterProvider router={router} />
        </AppProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
};

export default App;
