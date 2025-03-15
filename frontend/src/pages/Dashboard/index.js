import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
} from "@mui/material";
import {
  useAuth,
  useCurrency,
  useUser,
  useTransactions,
  useAlerts,
} from "../../context/AppProvider";
import { formatCurrency, formatDateTime } from "../../utils/formatters";

const Dashboard = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use our custom hooks from the AppProvider
  const { currentRates, fetchCurrentRates, error: ratesError } = useCurrency();
  const { wallets, fetchWallets, error: walletsError } = useUser();
  const {
    transactions,
    fetchTransactions,
    error: transactionsError,
  } = useTransactions();
  const { alerts, fetchAlerts, error: alertsError } = useAlerts();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch all dashboard data using our custom hooks
        await Promise.all([
          fetchCurrentRates(),
          fetchWallets(),
          fetchTransactions({ limit: 5 }), // Only get latest 5 transactions for dashboard
          fetchAlerts(),
        ]);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [
    isAuthenticated,
    fetchCurrentRates,
    fetchWallets,
    fetchTransactions,
    fetchAlerts,
  ]);

  // Combine all errors from hooks
  const combinedError =
    error || ratesError || walletsError || transactionsError || alertsError;

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

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
              You need to be logged in to view your dashboard.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (combinedError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{combinedError}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" component="h1">
          Welcome, {currentUser?.full_name || "User"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Last updated: {new Date().toLocaleString()}
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            variant="outlined"
            sx={{
              p: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total Wallets
            </Typography>
            <Typography variant="h3" component="div">
              {wallets.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Across {wallets.length} currencies
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            variant="outlined"
            sx={{
              p: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Active Alerts
            </Typography>
            <Typography variant="h3" component="div">
              {alerts.filter((a) => a.is_active).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monitoring exchange rates
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            variant="outlined"
            sx={{
              p: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Transactions
            </Typography>
            <Typography variant="h3" component="div">
              {transactions.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total processed
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            variant="outlined"
            sx={{
              p: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Exchange Rates
            </Typography>
            <Typography variant="h3" component="div">
              {currentRates.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Currencies tracked
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Dashboard Content */}
      <Grid container spacing={3}>
        {/* Exchange Rates */}
        <Grid item xs={12} md={8}>
          <Card variant="outlined">
            <CardHeader title="Latest Exchange Rates" />
            <Divider />
            <CardContent>
              {currentRates.length > 0 ? (
                <List>
                  {currentRates.slice(0, 5).map((rate, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography variant="subtitle1">
                                {rate.base_currency?.code}/
                                {rate.quote_currency?.code}
                              </Typography>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {rate.base_currency?.symbol}
                                {formatCurrency(rate.rate)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {rate.base_currency?.name} /{" "}
                                {rate.quote_currency?.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Updated: {formatDateTime(rate.timestamp)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < currentRates.slice(0, 5).length - 1 && (
                        <Divider />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" align="center">
                  No exchange rates available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Wallet Summary */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardHeader title="My Wallets" />
            <Divider />
            <CardContent>
              {wallets.length > 0 ? (
                <List>
                  {wallets.map((wallet, index) => (
                    <React.Fragment key={wallet.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1">
                              {wallet.currency.code}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="h6" component="span">
                              {wallet.currency.symbol}
                              {formatCurrency(wallet.balance)}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < wallets.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" align="center">
                  No wallets available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardHeader title="Recent Transactions" />
            <Divider />
            <CardContent>
              {transactions.length > 0 ? (
                <List>
                  {transactions.map((transaction) => (
                    <ListItem key={transaction.id}>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="subtitle1">
                              {transaction.from_currency.code} →{" "}
                              {transaction.to_currency.code}
                            </Typography>
                            <Typography variant="subtitle1">
                              {transaction.from_currency.symbol}
                              {formatCurrency(transaction.from_amount)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Rate:{" "}
                              {formatCurrency(
                                transaction.from_amount / transaction.to_amount
                              )}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatDateTime(transaction.transaction_date)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" align="center">
                  No transactions available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Active Alerts */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardHeader title="Active Alerts" />
            <Divider />
            <CardContent>
              {alerts.length > 0 ? (
                <List>
                  {alerts.map((alert) => (
                    <ListItem key={alert.id}>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="subtitle1">
                              {alert.base_currency.code}/
                              {alert.quote_currency.code}
                            </Typography>
                            <Chip
                              size="small"
                              label={
                                alert.is_above_threshold ? "Above" : "Below"
                              }
                              color={
                                alert.is_above_threshold ? "error" : "success"
                              }
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2">
                            Alert when rate goes{" "}
                            {alert.is_above_threshold ? "above" : "below"}{" "}
                            {formatCurrency(alert.threshold)}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" align="center">
                  No active alerts
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
