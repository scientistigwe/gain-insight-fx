import React, { useState, useEffect } from 'react';
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
  Chip
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { getCurrentRates } from '../../api/currencies';
import { getUserWallets } from '../../api/users';
import { getUserTransactions } from '../../api/transactions';
import { getUserAlerts } from '../../api/alerts';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currencyRates, setCurrencyRates] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // For now, just fetch currency rates
        const response = await getCurrentRates();
        setCurrencyRates(response.data);
        
        // Placeholder for wallet data
        setWallets([
          { id: 1, balance: 1000, currency: { code: 'NGN', symbol: '₦' } },
          { id: 2, balance: 500, currency: { code: 'USD', symbol: '$' } }
        ]);
        
        // Placeholder for transaction data
        setTransactions([
          { 
            id: 1, 
            from_currency: { code: 'NGN', symbol: '₦' }, 
            to_currency: { code: 'USD', symbol: '$' },
            from_amount: 50000,
            to_amount: 100,
            transaction_date: new Date().toISOString()
          }
        ]);
        
        // Placeholder for alert data
        setAlerts([
          {
            id: 1,
            base_currency: { code: 'NGN' },
            quote_currency: { code: 'USD' },
            threshold: 500,
            is_above_threshold: false,
            is_active: true
          }
        ]);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Welcome, {user?.full_name || 'User'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Last updated: {new Date().toLocaleString()}
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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
          <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Active Alerts
            </Typography>
            <Typography variant="h3" component="div">
              {alerts.filter(a => a.is_active).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monitoring exchange rates
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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
          <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Exchange Rates
            </Typography>
            <Typography variant="h3" component="div">
              {currencyRates.length}
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
              {currencyRates.length > 0 ? (
                <List>
                  {currencyRates.slice(0, 5).map((rate, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="subtitle1">
                                {rate.base_currency?.code}/{rate.quote_currency?.code}
                              </Typography>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {rate.base_currency?.symbol}{formatCurrency(rate.rate)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">
                                {rate.base_currency?.name} / {rate.quote_currency?.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Updated: {formatDateTime(rate.timestamp)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < currencyRates.slice(0, 5).length - 1 && <Divider />}
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
                              {wallet.currency.symbol}{formatCurrency(wallet.balance)}
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
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle1">
                              {transaction.from_currency.code} → {transaction.to_currency.code}
                            </Typography>
                            <Typography variant="subtitle1">
                              {transaction.from_currency.symbol}{formatCurrency(transaction.from_amount)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">
                              Rate: {formatCurrency(transaction.from_amount / transaction.to_amount)}
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
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle1">
                              {alert.base_currency.code}/{alert.quote_currency.code}
                            </Typography>
                            <Chip 
                              size="small"
                              label={alert.is_above_threshold ? 'Above' : 'Below'}
                              color={alert.is_above_threshold ? 'error' : 'success'}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2">
                            Alert when rate goes {alert.is_above_threshold ? 'above' : 'below'} {formatCurrency(alert.threshold)}
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