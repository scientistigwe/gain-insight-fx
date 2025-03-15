import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  FormLabel,
  FormControlLabel,
  Radio,
  RadioGroup,
  Select,
  MenuItem,
  InputLabel,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Switch,
  Chip,
  ButtonGroup,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import { useAlerts, useCurrency, useAuth } from "../../context/AppProvider";

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flexDirection: "column",
  minHeight: "50vh",
}));

const Alerts = () => {
  // Use our custom hooks from AppProvider
  const { isAuthenticated } = useAuth();
  const {
    alerts,
    loading: alertsLoading,
    error: alertsError,
    fetchAlerts,
    addAlert,
    editAlert: modifyAlert,
    removeAlert,
  } = useAlerts();

  const {
    currentRates,
    loading: ratesLoading,
    error: ratesError,
    fetchCurrentRates,
  } = useCurrency();

  const [showNewAlertModal, setShowNewAlertModal] = useState(false);
  const [alertForm, setAlertForm] = useState({
    base_currency_id: "",
    quote_currency_id: "",
    threshold: "",
    is_above_threshold: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [editAlertId, setEditAlertId] = useState(null);
  const [filterActive, setFilterActive] = useState("all"); // 'all', 'active', 'triggered'

  // Fetch currency rates and alerts on mount if authenticated
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!isAuthenticated) {
        return;
      }

      try {
        await fetchCurrentRates();
        await fetchAlerts();
      } catch (err) {
        console.error("Error fetching initial data:", err);
      }
    };

    fetchInitialData();
  }, [isAuthenticated, fetchCurrentRates, fetchAlerts]);

  const handleShowNewAlertModal = () => {
    setAlertForm({
      base_currency_id: "",
      quote_currency_id: "",
      threshold: "",
      is_above_threshold: true,
    });
    setEditAlertId(null);
    setFormErrors({});
    setShowNewAlertModal(true);
  };

  const handleEditAlert = (alert) => {
    setAlertForm({
      base_currency_id: alert.base_currency_id,
      quote_currency_id: alert.quote_currency_id,
      threshold: alert.threshold,
      is_above_threshold: alert.is_above_threshold,
      is_active: alert.is_active,
    });
    setEditAlertId(alert.id);
    setFormErrors({});
    setShowNewAlertModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAlertForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear related error
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setAlertForm((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleRadioChange = (e) => {
    const { value } = e.target;
    setAlertForm((prev) => ({
      ...prev,
      is_above_threshold: value === "true",
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!alertForm.base_currency_id) {
      errors.base_currency_id = "Please select the base currency";
    }

    if (!alertForm.quote_currency_id) {
      errors.quote_currency_id = "Please select the quote currency";
    }

    if (!alertForm.threshold || parseFloat(alertForm.threshold) <= 0) {
      errors.threshold = "Please enter a valid threshold greater than zero";
    }

    // Check if source and target currencies are the same
    if (alertForm.base_currency_id === alertForm.quote_currency_id) {
      errors.quote_currency_id = "Base and quote currencies cannot be the same";
    }

    return errors;
  };

  const handleSubmitAlert = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setFormErrors({
        submit: "You must be logged in to create alerts",
      });
      return;
    }

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      if (editAlertId) {
        // Update existing alert
        await modifyAlert(editAlertId, alertForm);
        setSuccessMessage("Alert updated successfully");
      } else {
        // Create new alert
        await addAlert(alertForm);
        setSuccessMessage("Alert created successfully");
      }

      // Close modal and reset form
      setShowNewAlertModal(false);
      setAlertForm({
        base_currency_id: "",
        quote_currency_id: "",
        threshold: "",
        is_above_threshold: true,
      });

      // Refresh alerts
      fetchAlerts();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error saving alert:", err);
      setFormErrors({
        submit:
          err.response?.data?.detail ||
          "Failed to save alert. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAlert = async (id) => {
    if (!isAuthenticated) {
      setSuccessMessage("You must be logged in to delete alerts");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this alert?")) {
      return;
    }

    try {
      await removeAlert(id);

      // Refresh alerts
      fetchAlerts();

      // Show success message
      setSuccessMessage("Alert deleted successfully");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error deleting alert:", err);
      setSuccessMessage("Error deleting alert. Please try again.");
    }
  };

  const handleToggleAlertStatus = async (alert) => {
    if (!isAuthenticated) {
      setSuccessMessage("You must be logged in to update alerts");
      return;
    }

    try {
      await modifyAlert(alert.id, {
        is_active: !alert.is_active,
      });

      // Refresh alerts
      fetchAlerts();
    } catch (err) {
      console.error("Error toggling alert status:", err);
    }
  };

  // Filter alerts based on selected filter
  const getFilteredAlerts = () => {
    if (filterActive === "all") {
      return alerts;
    } else if (filterActive === "active") {
      return alerts.filter((alert) => alert.is_active);
    } else if (filterActive === "triggered") {
      return alerts.filter((alert) => alert.is_triggered);
    }
    return alerts;
  };

  // Find currency by ID
  const findCurrencyById = (id) => {
    let currency = null;

    currentRates.forEach((rate) => {
      if (rate.base_currency.id === id) {
        currency = rate.base_currency;
      } else if (rate.quote_currency.id === id) {
        currency = rate.quote_currency;
      }
    });

    return currency;
  };

  // Check if an alert is triggered based on current rates
  const isAlertTriggered = (alert) => {
    // Find current rate
    const fromCurrency = findCurrencyById(alert.base_currency_id);
    const toCurrency = findCurrencyById(alert.quote_currency_id);

    if (!fromCurrency || !toCurrency) {
      return false;
    }

    // Find exchange rate
    let rate = null;

    // Direct rate
    const directRate = currentRates.find(
      (r) =>
        r.base_currency.id === alert.base_currency_id &&
        r.quote_currency.id === alert.quote_currency_id
    );

    if (directRate) {
      rate = directRate.rate;
    } else {
      // Inverse rate
      const inverseRate = currentRates.find(
        (r) =>
          r.base_currency.id === alert.quote_currency_id &&
          r.quote_currency.id === alert.base_currency_id
      );

      if (inverseRate) {
        rate = 1 / inverseRate.rate;
      }
    }

    if (rate === null) {
      return false;
    }

    // Check if threshold is crossed
    if (alert.is_above_threshold) {
      return rate >= alert.threshold;
    } else {
      return rate <= alert.threshold;
    }
  };

  const filteredAlerts = getFilteredAlerts();
  const loading = alertsLoading || ratesLoading;
  const error = alertsError || ratesError;

  // Show a message if the user is not authenticated
  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" align="center" gutterBottom>
              Please Sign In
            </Typography>
            <Typography variant="body1" align="center">
              You need to be logged in to view and manage alerts.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (loading && !alerts.length) {
    return (
      <LoadingContainer>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading alerts...
        </Typography>
      </LoadingContainer>
    );
  }

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
          Alerts
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleShowNewAlertModal}
        >
          Create New Alert
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <StyledCard elevation={2}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="body1" sx={{ mr: 2 }}>
                Filter:
              </Typography>
              <ButtonGroup size="small">
                <Button
                  variant={filterActive === "all" ? "contained" : "outlined"}
                  onClick={() => setFilterActive("all")}
                >
                  All
                </Button>
                <Button
                  variant={filterActive === "active" ? "contained" : "outlined"}
                  onClick={() => setFilterActive("active")}
                >
                  Active
                </Button>
                <Button
                  variant={
                    filterActive === "triggered" ? "contained" : "outlined"
                  }
                  onClick={() => setFilterActive("triggered")}
                >
                  Triggered
                </Button>
              </ButtonGroup>
            </Box>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchAlerts}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          {filteredAlerts.length > 0 ? (
            <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Currency Pair</TableCell>
                    <TableCell>Alert Condition</TableCell>
                    <TableCell>Current Status</TableCell>
                    <TableCell>Last Triggered</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAlerts.map((alert) => {
                    const baseCurrency = findCurrencyById(
                      alert.base_currency_id
                    );
                    const quoteCurrency = findCurrencyById(
                      alert.quote_currency_id
                    );
                    const triggered = isAlertTriggered(alert);

                    if (!baseCurrency || !quoteCurrency) {
                      return null; // Skip if currencies not found
                    }

                    return (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <Typography variant="body1">
                            {baseCurrency.code}/{quoteCurrency.code}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {baseCurrency.name}/{quoteCurrency.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {alert.is_above_threshold ? "Above" : "Below"}{" "}
                            {formatCurrency(alert.threshold)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Switch
                              size="small"
                              checked={alert.is_active}
                              onChange={() => handleToggleAlertStatus(alert)}
                              sx={{ mr: 1 }}
                            />
                            <Chip
                              label={
                                alert.is_active
                                  ? triggered
                                    ? "Triggered"
                                    : "Monitoring"
                                  : "Inactive"
                              }
                              color={
                                alert.is_active
                                  ? triggered
                                    ? "error"
                                    : "success"
                                  : "default"
                              }
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          {alert.last_triggered_at
                            ? formatDateTime(alert.last_triggered_at)
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => handleEditAlert(alert)}
                            sx={{ mr: 1 }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteAlert(alert.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body1" color="text.secondary" paragraph>
                No alerts found.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleShowNewAlertModal}
              >
                Create Your First Alert
              </Button>
            </Box>
          )}
        </CardContent>
      </StyledCard>

      {/* New/Edit Alert Dialog */}
      <Dialog
        open={showNewAlertModal}
        onClose={() => setShowNewAlertModal(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editAlertId ? "Edit Alert" : "Create New Alert"}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmitAlert} sx={{ mt: 2 }}>
            {formErrors.submit && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {formErrors.submit}
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!formErrors.base_currency_id}>
                  <InputLabel>Base Currency</InputLabel>
                  <Select
                    name="base_currency_id"
                    value={alertForm.base_currency_id}
                    onChange={handleInputChange}
                    label="Base Currency"
                  >
                    <MenuItem value="">
                      <em>Select base currency</em>
                    </MenuItem>
                    {currentRates.map((rate) => {
                      const currency = rate.base_currency;
                      return (
                        <MenuItem
                          key={`base-${currency.id}`}
                          value={currency.id}
                        >
                          {currency.code} - {currency.name}
                        </MenuItem>
                      );
                    })}
                  </Select>
                  {formErrors.base_currency_id && (
                    <Typography variant="caption" color="error">
                      {formErrors.base_currency_id}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!formErrors.quote_currency_id}>
                  <InputLabel>Quote Currency</InputLabel>
                  <Select
                    name="quote_currency_id"
                    value={alertForm.quote_currency_id}
                    onChange={handleInputChange}
                    label="Quote Currency"
                  >
                    <MenuItem value="">
                      <em>Select quote currency</em>
                    </MenuItem>
                    {currentRates.map((rate) => {
                      const currency = rate.quote_currency;
                      return (
                        <MenuItem
                          key={`quote-${currency.id}`}
                          value={currency.id}
                        >
                          {currency.code} - {currency.name}
                        </MenuItem>
                      );
                    })}
                  </Select>
                  {formErrors.quote_currency_id && (
                    <Typography variant="caption" color="error">
                      {formErrors.quote_currency_id}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Alert When Rate Is</FormLabel>
                  <RadioGroup
                    name="is_above_threshold"
                    value={alertForm.is_above_threshold.toString()}
                    onChange={handleRadioChange}
                  >
                    <FormControlLabel
                      value="true"
                      control={<Radio />}
                      label="Above threshold"
                    />
                    <FormControlLabel
                      value="false"
                      control={<Radio />}
                      label="Below threshold"
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  name="threshold"
                  value={alertForm.threshold}
                  onChange={handleInputChange}
                  label="Threshold Value"
                  placeholder="Enter threshold value"
                  inputProps={{
                    step: "0.0001",
                    min: "0.0001",
                  }}
                  error={!!formErrors.threshold}
                  helperText={formErrors.threshold}
                />
              </Grid>

              {editAlertId && (
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="is_active"
                        checked={alertForm.is_active}
                        onChange={handleCheckboxChange}
                      />
                    }
                    label="Alert is active"
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewAlertModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitAlert}
            disabled={submitting}
          >
            {submitting
              ? "Saving..."
              : editAlertId
              ? "Update Alert"
              : "Create Alert"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Alerts;
