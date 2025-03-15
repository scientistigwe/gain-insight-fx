import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  InputAdornment,
  Switch,
  DialogContentText,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import { formatDateTime } from "../../utils/formatters";
import { useAdmin } from "../../context/AppProvider";

const AdminUsers = () => {
  // Use the admin hook from AppProvider
  const { users, loading, error, fetchUsers, addUser, editUser, removeUser } = useAdmin();
  
  const [successMessage, setSuccessMessage] = useState("");

  // User dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create"); // 'create' or 'edit'
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userForm, setUserForm] = useState({
    email: "",
    full_name: "",
    password: "",
    confirm_password: "",
    is_active: true,
    is_admin: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle new user button click
  const handleNewUser = () => {
    setDialogMode("create");
    setSelectedUserId(null);
    setUserForm({
      email: "",
      full_name: "",
      password: "",
      confirm_password: "",
      is_active: true,
      is_admin: false,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  // Handle edit user button click
  const handleEditUser = (user) => {
    setDialogMode("edit");
    setSelectedUserId(user.id);
    setUserForm({
      email: user.email,
      full_name: user.full_name || "",
      password: "",
      confirm_password: "",
      is_active: user.is_active,
      is_admin: user.is_admin,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  // Handle user form input change
  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setUserForm((prev) => ({
      ...prev,
      [name]: name === "is_active" || name === "is_admin" ? checked : value,
    }));

    // Clear related error
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Validate user form
  const validateForm = () => {
    const errors = {};

    if (!userForm.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(userForm.email)) {
      errors.email = "Email is invalid";
    }

    if (dialogMode === "create") {
      if (!userForm.password) {
        errors.password = "Password is required";
      } else if (userForm.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
      }

      if (userForm.password !== userForm.confirm_password) {
        errors.confirm_password = "Passwords do not match";
      }
    } else if (userForm.password) {
      // If editing and password is provided, validate it
      if (userForm.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
      }

      if (userForm.password !== userForm.confirm_password) {
        errors.confirm_password = "Passwords do not match";
      }
    }

    return errors;
  };

  // Handle user form submit
  const handleSubmitUser = async (e) => {
    e.preventDefault();

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      if (dialogMode === "create") {
        // Create new user
        await addUser({
          email: userForm.email,
          full_name: userForm.full_name,
          password: userForm.password,
          is_active: userForm.is_active,
          is_admin: userForm.is_admin,
        });

        setSuccessMessage("User created successfully");
      } else {
        // Update existing user
        const userData = {
          full_name: userForm.full_name,
          is_active: userForm.is_active,
          is_admin: userForm.is_admin,
        };

        // Only include password if it's provided
        if (userForm.password) {
          userData.password = userForm.password;
        }

        await editUser(selectedUserId, userData);
        setSuccessMessage("User updated successfully");
      }

      // Close dialog
      setDialogOpen(false);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error saving user:", err);
      setFormErrors({
        submit:
          err.response?.data?.detail ||
          "An error occurred while saving the user",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete user confirmation
  const handleDeleteConfirmation = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    try {
      await removeUser(userToDelete.id);
      setSuccessMessage("User deleted successfully");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error deleting user:", err);
      setSuccessMessage("Failed to delete user. Please try again later.");
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  // Handle toggle user status
  const handleToggleUserStatus = async (user) => {
    try {
      await editUser(user.id, {
        is_active: !user.is_active,
      });

      setSuccessMessage(
        `User ${user.is_active ? "deactivated" : "activated"} successfully`
      );

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error updating user status:", err);
      setSuccessMessage("Failed to update user status. Please try again later.");
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" component="h1">
          User Management
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleNewUser}
        >
          Add New User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error.message || "An error occurred"}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Paper variant="outlined">
        <TableContainer>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : users.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.full_name || "—"}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_admin ? "Admin" : "User"}
                        color={user.is_admin ? "error" : "info"}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={user.is_active}
                            onChange={() => handleToggleUserStatus(user)}
                            color="primary"
                            size="small"
                          />
                        }
                        label={user.is_active ? "Active" : "Inactive"}
                      />
                    </TableCell>
                    <TableCell>{formatDateTime(user.created_at)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        aria-label="edit user"
                        onClick={() => handleEditUser(user)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        aria-label="delete user"
                        onClick={() => handleDeleteConfirmation(user)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary">
                No users found.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleNewUser}
                sx={{ mt: 2 }}
              >
                Add Your First User
              </Button>
            </Box>
          )}
        </TableContainer>
      </Paper>

      {/* User Form Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === "create" ? "Add New User" : "Edit User"}
        </DialogTitle>
        <DialogContent>
          {formErrors.submit && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {formErrors.submit}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmitUser}
            noValidate
            sx={{ mt: 1 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={userForm.email}
                  onChange={handleInputChange}
                  disabled={dialogMode === "edit"} // Email can't be changed in edit mode
                  required
                  margin="normal"
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="full_name"
                  value={userForm.full_name}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={
                    dialogMode === "create"
                      ? "Password"
                      : "New Password (optional)"
                  }
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={userForm.password}
                  onChange={handleInputChange}
                  required={dialogMode === "create"}
                  margin="normal"
                  error={!!formErrors.password}
                  helperText={formErrors.password || "Minimum 8 characters"}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? (
                            <VisibilityOffIcon />
                          ) : (
                            <VisibilityIcon />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="confirm_password"
                  type={showPassword ? "text" : "password"}
                  value={userForm.confirm_password}
                  onChange={handleInputChange}
                  required={
                    dialogMode === "create" || userForm.password.length > 0
                  }
                  margin="normal"
                  error={!!formErrors.confirm_password}
                  helperText={formErrors.confirm_password}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={userForm.is_active}
                      onChange={handleInputChange}
                      name="is_active"
                      color="primary"
                    />
                  }
                  label="User is active"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={userForm.is_admin}
                      onChange={handleInputChange}
                      name="is_admin"
                      color="primary"
                    />
                  }
                  label="User has admin privileges"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button
            onClick={handleSubmitUser}
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : dialogMode === "create" ? (
              "Create User"
            ) : (
              "Update User"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the user "{userToDelete?.email}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminUsers;