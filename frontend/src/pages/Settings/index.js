import React, { useState } from "react";
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  TextField,
  Button,
  Divider,
  Alert,
  Tab,
  Tabs,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useAuth, useUser } from "../../context/AppProvider"; // Updated import
import { updateUserProfile, updateUserPassword } from "../../api/users";

const Settings = () => {
  const { currentUser, logout } = useAuth(); // Changed from user to currentUser
  const { updateProfile } = useUser(); // Added from useUser hook

  // Tab state
  const [currentTab, setCurrentTab] = useState(0);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: currentUser?.full_name || "", // Changed from user to currentUser
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Logout confirmation dialog
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Handle profile form input change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear related error
    if (profileErrors[name]) {
      setProfileErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Handle password form input change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear related error
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Toggle password visibility
  const handleTogglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Handle profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const errors = {};
    if (!profileForm.full_name) {
      errors.full_name = "Full name is required";
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    setProfileSubmitting(true);

    try {
      // Use updateProfile from useUser hook if available, otherwise fall back to API call
      if (updateProfile) {
        await updateProfile(profileForm);
      } else {
        await updateUserProfile(profileForm);
      }

      setProfileSuccess("Profile updated successfully");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setProfileSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setProfileErrors({
        submit:
          err.response?.data?.detail ||
          "Failed to update profile. Please try again.",
      });
    } finally {
      setProfileSubmitting(false);
    }
  };

  // Handle password form submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const errors = {};
    if (!passwordForm.current_password) {
      errors.current_password = "Current password is required";
    }

    if (!passwordForm.new_password) {
      errors.new_password = "New password is required";
    } else if (passwordForm.new_password.length < 8) {
      errors.new_password = "Password must be at least 8 characters long";
    }

    if (!passwordForm.confirm_password) {
      errors.confirm_password = "Please confirm your new password";
    } else if (passwordForm.new_password !== passwordForm.confirm_password) {
      errors.confirm_password = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setPasswordSubmitting(true);

    try {
      await updateUserPassword(passwordForm);
      setPasswordSuccess("Password updated successfully");

      // Clear form
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setPasswordSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Error updating password:", err);

      if (err.response?.status === 400) {
        setPasswordErrors({
          current_password: "Incorrect current password",
        });
      } else {
        setPasswordErrors({
          submit:
            err.response?.data?.detail ||
            "Failed to update password. Please try again.",
        });
      }
    } finally {
      setPasswordSubmitting(false);
    }
  };

  // Handle logout button click
  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };

  // Handle logout confirmation
  const handleLogoutConfirm = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="settings tabs"
        >
          <Tab
            label="Profile"
            id="settings-tab-0"
            aria-controls="settings-tabpanel-0"
          />
          <Tab
            label="Password"
            id="settings-tab-1"
            aria-controls="settings-tabpanel-1"
          />
          <Tab
            label="Account"
            id="settings-tab-2"
            aria-controls="settings-tabpanel-2"
          />
        </Tabs>
      </Box>

      {/* Profile Tab */}
      <div
        role="tabpanel"
        hidden={currentTab !== 0}
        id="settings-tabpanel-0"
        aria-labelledby="settings-tab-0"
      >
        {currentTab === 0 && (
          <Card variant="outlined">
            <CardHeader title="Profile Information" />
            <Divider />
            <CardContent>
              {profileSuccess && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {profileSuccess}
                </Alert>
              )}

              {profileErrors.submit && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {profileErrors.submit}
                </Alert>
              )}

              <Box component="form" onSubmit={handleProfileSubmit} noValidate>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={currentUser?.email || ""} // Changed from user to currentUser
                      disabled
                      variant="outlined"
                      helperText="Your email address cannot be changed"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="full_name"
                      value={profileForm.full_name}
                      onChange={handleProfileChange}
                      error={!!profileErrors.full_name}
                      helperText={profileErrors.full_name}
                      variant="outlined"
                      required
                    />
                  </Grid>
                </Grid>

                <Box
                  sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}
                >
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={profileSubmitting}
                  >
                    {profileSubmitting ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Password Tab */}
      <div
        role="tabpanel"
        hidden={currentTab !== 1}
        id="settings-tabpanel-1"
        aria-labelledby="settings-tab-1"
      >
        {currentTab === 1 && (
          <Card variant="outlined">
            <CardHeader title="Change Password" />
            <Divider />
            <CardContent>
              {passwordSuccess && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {passwordSuccess}
                </Alert>
              )}

              {passwordErrors.submit && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {passwordErrors.submit}
                </Alert>
              )}

              <Box component="form" onSubmit={handlePasswordSubmit} noValidate>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Current Password"
                      name="current_password"
                      type={showPassword.current ? "text" : "password"}
                      value={passwordForm.current_password}
                      onChange={handlePasswordChange}
                      error={!!passwordErrors.current_password}
                      helperText={passwordErrors.current_password}
                      variant="outlined"
                      required
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle current password visibility"
                              onClick={() =>
                                handleTogglePasswordVisibility("current")
                              }
                              edge="end"
                            >
                              {showPassword.current ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="New Password"
                      name="new_password"
                      type={showPassword.new ? "text" : "password"}
                      value={passwordForm.new_password}
                      onChange={handlePasswordChange}
                      error={!!passwordErrors.new_password}
                      helperText={
                        passwordErrors.new_password ||
                        "Password must be at least 8 characters long"
                      }
                      variant="outlined"
                      required
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle new password visibility"
                              onClick={() =>
                                handleTogglePasswordVisibility("new")
                              }
                              edge="end"
                            >
                              {showPassword.new ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Confirm New Password"
                      name="confirm_password"
                      type={showPassword.confirm ? "text" : "password"}
                      value={passwordForm.confirm_password}
                      onChange={handlePasswordChange}
                      error={!!passwordErrors.confirm_password}
                      helperText={passwordErrors.confirm_password}
                      variant="outlined"
                      required
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle confirm password visibility"
                              onClick={() =>
                                handleTogglePasswordVisibility("confirm")
                              }
                              edge="end"
                            >
                              {showPassword.confirm ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>

                <Box
                  sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}
                >
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={passwordSubmitting}
                  >
                    {passwordSubmitting ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Account Tab */}
      <div
        role="tabpanel"
        hidden={currentTab !== 2}
        id="settings-tabpanel-2"
        aria-labelledby="settings-tab-2"
      >
        {currentTab === 2 && (
          <Card variant="outlined">
            <CardHeader title="Account Actions" />
            <Divider />
            <CardContent>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Logout
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  End your current session.
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleLogoutClick}
                >
                  Logout
                </Button>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box>
                <Typography variant="h6" gutterBottom>
                  Delete Account
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => alert("This feature is not yet implemented")}
                >
                  Delete Account
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
      >
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to logout? You will need to sign in again to
            access your account.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleLogoutConfirm} color="error">
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Settings;
