import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Container,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  CircularProgress,
  Alert,
  Box,
  Tabs,
  Tab,
  Chip,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import {
  getUserTransactions,
  createTransaction,
  deleteTransaction,
} from "../../api/transactions";
import { getCurrentRates } from "../../api/currencies";
import { getUserWallets } from "../../api/users";
import { formatCurrency, formatDateTime } from "../../utils/formatters";

// Styled components
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  maxHeight: 440,
}));

const StyledAlert = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const StatCard = styled(Card)(({ theme }) => ({
  textAlign: "center",
  height: "100%",
  backgroundColor: theme.palette.grey[50],
}));

// Component for the transaction table
const TransactionTable = ({
  transactions,
  onDelete,
  currencyFilter,
  sortConfig,
}) => {
  // Sort transactions based on the current sortConfig
  const sortedTransactions = useMemo(() => {
    const sorted = [...transactions];

    if (sortConfig.key) {
      sorted.sort((a, b) => {
        let comparison = 0;

        switch (sortConfig.key) {
          case "date":
            comparison =
              new Date(a.transaction_date) - new Date(b.transaction_date);
            break;
          case "amount":
            comparison = a.from_amount - b.from_amount;
            break;
          case "rate":
            comparison = a.exchange_rate - b.exchange_rate;
            break;
          default:
            comparison = 0;
        }

        return sortConfig.direction === "asc" ? comparison : -comparison;
      });
    }

    // Apply currency filter
    if (currencyFilter) {
      return sorted.filter(
        (transaction) =>
          transaction.from_currency.code === currencyFilter ||
          transaction.to_currency.code === currencyFilter
      );
    }

    return sorted;
  }, [transactions, sortConfig, currencyFilter]);

  if (sortedTransactions.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No transactions found.
        </Typography>
      </Box>
    );
  }

  return (
    <StyledTableContainer component={Paper} elevation={0}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>From</TableCell>
            <TableCell>To</TableCell>
            <TableCell>Rate</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedTransactions.map((transaction) => (
            <TableRow key={transaction.id} hover>
              <TableCell>
                {formatDateTime(transaction.transaction_date)}
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {transaction.from_currency.symbol}{" "}
                  {formatCurrency(transaction.from_amount)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({transaction.from_currency.code})
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {transaction.to_currency.symbol}{" "}
                  {formatCurrency(transaction.to_amount)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({transaction.to_currency.code})
                </Typography>
              </TableCell>
              <TableCell>{formatCurrency(transaction.exchange_rate)}</TableCell>
              <TableCell>{transaction.description || "-"}</TableCell>
              <TableCell>
                <IconButton
                  color="error"
                  size="small"
                  onClick={() => onDelete(transaction.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </StyledTableContainer>
  );
};

// Component for the transaction summary
const TransactionSummary = ({ transactions, currencyRates }) => {
  // Calculate totals by currency
  const totalsByCurrency = useMemo(() => {
    const totals = {};

    transactions.forEach((transaction) => {
      // From currency
      const fromCurrency = transaction.from_currency.code;
      if (!totals[fromCurrency]) {
        totals[fromCurrency] = {
          outgoing: 0,
          incoming: 0,
        };
      }
      totals[fromCurrency].outgoing += transaction.from_amount;

      // To currency
      const toCurrency = transaction.to_currency.code;
      if (!totals[toCurrency]) {
        totals[toCurrency] = {
          outgoing: 0,
          incoming: 0,
        };
      }
      totals[toCurrency].incoming += transaction.to_amount;
    });

    return totals;
  }, [transactions]);

  // Get unique currencies for display
  const uniqueCurrencies = useMemo(() => {
    const currencyCodes = new Set();

    transactions.forEach((transaction) => {
      currencyCodes.add(transaction.from_currency.code);
      currencyCodes.add(transaction.to_currency.code);
    });

    return Array.from(currencyCodes).sort();
  }, [transactions]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Transaction Summary by Currency
        </Typography>

        <TableContainer component={Paper} elevation={0} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Currency</TableCell>
                <TableCell>Outgoing</TableCell>
                <TableCell>Incoming</TableCell>
                <TableCell>Net Flow</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(totalsByCurrency)
                .sort()
                .map(([currency, data]) => {
                  const netFlow = data.incoming - data.outgoing;
                  const currencyObj = currencyRates.find(
                    (r) =>
                      r.base_currency.code === currency ||
                      r.quote_currency.code === currency
                  );
                  const symbol = currencyObj
                    ? currencyObj.base_currency.code === currency
                      ? currencyObj.base_currency.symbol
                      : currencyObj.quote_currency.symbol
                    : "";

                  return (
                    <TableRow key={currency} hover>
                      <TableCell>{currency}</TableCell>
                      <TableCell>
                        {symbol} {formatCurrency(data.outgoing)}
                      </TableCell>
                      <TableCell>
                        {symbol} {formatCurrency(data.incoming)}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: netFlow >= 0 ? "success.main" : "error.main",
                        }}
                      >
                        {symbol} {formatCurrency(Math.abs(netFlow))}{" "}
                        {netFlow >= 0 ? "gain" : "loss"}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="h6" gutterBottom>
          Transaction Volume
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <StatCard elevation={1}>
              <CardContent>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  gutterBottom
                >
                  Total Transactions
                </Typography>
                <Typography variant="h3">{transactions.length}</Typography>
              </CardContent>
            </StatCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard elevation={1}>
              <CardContent>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  gutterBottom
                >
                  Currencies Used
                </Typography>
                <Typography variant="h3">{uniqueCurrencies.length}</Typography>
              </CardContent>
            </StatCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard elevation={1}>
              <CardContent>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  gutterBottom
                >
                  Last Transaction
                </Typography>
                <Typography variant="h6">
                  {transactions.length > 0
                    ? formatDateTime(transactions[0].transaction_date)
                    : "N/A"}
                </Typography>
              </CardContent>
            </StatCard>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// New Transaction Form component
const TransactionForm = ({
  onSubmit,
  onCancel,
  wallets,
  currencyRates,
  submitting,
}) => {
  const [form, setForm] = useState({
    from_currency_id: "",
    to_currency_id: "",
    from_amount: "",
    description: "",
    source: "",
    reference: "",
  });
  const [calculatedData, setCalculatedData] = useState({
    to_amount: 0,
    exchange_rate: 0,
  });
  const [errors, setErrors] = useState({});

  // Set default from_currency if wallets exist
  useEffect(() => {
    if (wallets.length > 0 && !form.from_currency_id) {
      setForm((prev) => ({
        ...prev,
        from_currency_id: wallets[0].currency.id,
      }));
    }
  }, [wallets, form.from_currency_id]);

  // Calculate exchange rate and to_amount when form changes
  useEffect(() => {
    if (!form.from_currency_id || !form.to_currency_id || !form.from_amount) {
      return;
    }

    // Find the appropriate exchange rate
    const rate = findExchangeRate(
      currencyRates,
      parseInt(form.from_currency_id),
      parseInt(form.to_currency_id)
    );

    if (rate) {
      const from_amount = parseFloat(form.from_amount);
      const to_amount = from_amount * rate;

      setCalculatedData({
        exchange_rate: rate,
        to_amount: to_amount,
      });
    }
  }, [
    form.from_currency_id,
    form.to_currency_id,
    form.from_amount,
    currencyRates,
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear related error
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.from_currency_id) {
      newErrors.from_currency_id = "Please select the source currency";
    }

    if (!form.to_currency_id) {
      newErrors.to_currency_id = "Please select the target currency";
    }

    if (!form.from_amount || parseFloat(form.from_amount) <= 0) {
      newErrors.from_amount = "Please enter a valid amount greater than zero";
    }

    // Check if source and target currencies are the same
    if (form.from_currency_id === form.to_currency_id) {
      newErrors.to_currency_id =
        "Source and target currencies cannot be the same";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const transactionData = {
      ...form,
      from_amount: parseFloat(form.from_amount),
      to_amount: calculatedData.to_amount,
      exchange_rate: calculatedData.exchange_rate,
      transaction_date: new Date().toISOString(),
    };

    onSubmit(transactionData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      <Grid container spacing={3}>
        <Grid item md={6} xs={12}>
          <FormControl fullWidth error={!!errors.from_currency_id}>
            <InputLabel id="from-currency-label">From Currency</InputLabel>
            <Select
              labelId="from-currency-label"
              id="from_currency_id"
              name="from_currency_id"
              value={form.from_currency_id}
              onChange={handleInputChange}
              label="From Currency"
            >
              <MenuItem value="">Select currency</MenuItem>
              {wallets.map((wallet) => (
                <MenuItem key={wallet.currency.id} value={wallet.currency.id}>
                  {wallet.currency.code} - Balance: {wallet.currency.symbol}
                  {formatCurrency(wallet.balance)}
                </MenuItem>
              ))}
            </Select>
            {errors.from_currency_id && (
              <Typography variant="caption" color="error">
                {errors.from_currency_id}
              </Typography>
            )}
          </FormControl>
        </Grid>

        <Grid item md={6} xs={12}>
          <FormControl fullWidth error={!!errors.to_currency_id}>
            <InputLabel id="to-currency-label">To Currency</InputLabel>
            <Select
              labelId="to-currency-label"
              id="to_currency_id"
              name="to_currency_id"
              value={form.to_currency_id}
              onChange={handleInputChange}
              label="To Currency"
            >
              <MenuItem value="">Select currency</MenuItem>
              {currencyRates.map((rate) => {
                const currency = rate.quote_currency;
                return (
                  <MenuItem key={currency.id} value={currency.id}>
                    {currency.code} - {currency.name}
                  </MenuItem>
                );
              })}
            </Select>
            {errors.to_currency_id && (
              <Typography variant="caption" color="error">
                {errors.to_currency_id}
              </Typography>
            )}
          </FormControl>
        </Grid>

        <Grid item md={6} xs={12}>
          <TextField
            fullWidth
            label="Amount to Exchange"
            name="from_amount"
            type="number"
            value={form.from_amount}
            onChange={handleInputChange}
            placeholder="Enter amount"
            inputProps={{
              step: "0.01",
              min: "0.01",
            }}
            error={!!errors.from_amount}
            helperText={errors.from_amount}
          />
        </Grid>

        <Grid item md={6} xs={12}>
          <TextField
            fullWidth
            label="You Will Receive"
            value={
              calculatedData.to_amount
                ? formatCurrency(calculatedData.to_amount)
                : ""
            }
            disabled
            helperText={
              calculatedData.exchange_rate
                ? `Exchange Rate: ${formatCurrency(
                    calculatedData.exchange_rate
                  )}`
                : ""
            }
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description (Optional)"
            name="description"
            value={form.description}
            onChange={handleInputChange}
            placeholder="Add a description for this transaction"
            multiline
            rows={2}
          />
        </Grid>

        <Grid item md={6} xs={12}>
          <TextField
            fullWidth
            label="Source (Optional)"
            name="source"
            value={form.source}
            onChange={handleInputChange}
            placeholder="e.g., Bank, Exchange Office"
          />
        </Grid>

        <Grid item md={6} xs={12}>
          <TextField
            fullWidth
            label="Reference (Optional)"
            name="reference"
            value={form.reference}
            onChange={handleInputChange}
            placeholder="e.g., Receipt number, transaction ID"
          />
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
        <Button onClick={onCancel} sx={{ mr: 1 }} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create Transaction"}
        </Button>
      </Box>
    </Box>
  );
};

// Helper functions
const findExchangeRate = (rates, fromCurrencyId, toCurrencyId) => {
  // This is a memoizable pure function

  // Direct rate
  const directRate = rates.find(
    (r) =>
      r.base_currency.id === fromCurrencyId &&
      r.quote_currency.id === toCurrencyId
  );

  if (directRate) {
    return directRate.rate;
  }

  // Inverse rate
  const inverseRate = rates.find(
    (r) =>
      r.base_currency.id === toCurrencyId &&
      r.quote_currency.id === fromCurrencyId
  );

  if (inverseRate) {
    return 1 / inverseRate.rate;
  }

  // If neither direct nor inverse rate exists, return a default
  return 1.0;
};

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Main Transactions component
const Transactions = () => {
  // State
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [currencyRates, setCurrencyRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [filterCurrency, setFilterCurrency] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  const [tabValue, setTabValue] = useState(0);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [transactionsRes, walletsRes, ratesRes] = await Promise.all([
          getUserTransactions(),
          getUserWallets(),
          getCurrentRates(),
        ]);

        setTransactions(transactionsRes.data);
        setWallets(walletsRes.data);
        setCurrencyRates(ratesRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please refresh the page and try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get unique currency codes from transactions for filtering
  const uniqueCurrencies = useMemo(() => {
    const currencyCodes = new Set();

    transactions.forEach((transaction) => {
      currencyCodes.add(transaction.from_currency.code);
      currencyCodes.add(transaction.to_currency.code);
    });

    return Array.from(currencyCodes).sort();
  }, [transactions]);

  // Event handlers
  const handleNewTransaction = useCallback(() => {
    setShowNewTransactionModal(true);
  }, []);

  const handleSubmitTransaction = useCallback(async (transactionData) => {
    setSubmitting(true);

    try {
      const response = await createTransaction(transactionData);

      // Add new transaction to the list
      setTransactions((prev) => [response.data, ...prev]);

      // Show success message
      setSuccessMessage("Transaction created successfully");

      // Close modal
      setShowNewTransactionModal(false);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error creating transaction:", err);
      setError(
        err.response?.data?.detail ||
          "Failed to create transaction. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }, []);

  const handleDeleteTransaction = useCallback(async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    try {
      await deleteTransaction(id);

      // Remove deleted transaction from the list
      setTransactions((prev) =>
        prev.filter((transaction) => transaction.id !== id)
      );

      // Show success message
      setSuccessMessage("Transaction deleted successfully");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error deleting transaction:", err);
      setError(
        err.response?.data?.detail ||
          "Failed to delete transaction. Please try again."
      );
    }
  }, []);

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Render loading state
  if (loading && !transactions.length) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
          flexDirection: "column",
        }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading transactions...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" component="h1">
          Transactions
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleNewTransaction}
        >
          New Transaction
        </Button>
      </Box>

      {error && <StyledAlert severity="error">{error}</StyledAlert>}
      {successMessage && (
        <StyledAlert severity="success">{successMessage}</StyledAlert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="transaction tabs"
        >
          <Tab label="Transaction List" id="tab-0" />
          <Tab label="Summary" id="tab-1" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
                flexDirection: { xs: "column", md: "row" },
                gap: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  width: { xs: "100%", md: "auto" },
                }}
              >
                <Typography variant="body1" sx={{ mr: 2 }}>
                  Filter by Currency:
                </Typography>
                <FormControl sx={{ minWidth: 200 }}>
                  <Select
                    size="small"
                    value={filterCurrency}
                    onChange={(e) => setFilterCurrency(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">All Currencies</MenuItem>
                    {uniqueCurrencies.map((code) => (
                      <MenuItem key={code} value={code}>
                        {code}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  width: { xs: "100%", md: "auto" },
                }}
              >
                <Typography variant="body1" sx={{ mr: 2 }}>
                  Sort by:
                </Typography>
                <FormControl sx={{ minWidth: 140, mr: 1 }}>
                  <Select
                    size="small"
                    value={sortConfig.key}
                    onChange={(e) => handleSort(e.target.value)}
                  >
                    <MenuItem value="date">Date</MenuItem>
                    <MenuItem value="amount">Amount</MenuItem>
                    <MenuItem value="rate">Exchange Rate</MenuItem>
                  </Select>
                </FormControl>
                <IconButton
                  onClick={() =>
                    setSortConfig((prev) => ({
                      ...prev,
                      direction: prev.direction === "asc" ? "desc" : "asc",
                    }))
                  }
                  size="small"
                >
                  {sortConfig.direction === "asc" ? (
                    <ArrowUpwardIcon />
                  ) : (
                    <ArrowDownwardIcon />
                  )}
                </IconButton>
              </Box>
            </Box>

            <TransactionTable
              transactions={transactions}
              onDelete={handleDeleteTransaction}
              currencyFilter={filterCurrency}
              sortConfig={sortConfig}
            />

            {transactions.length === 0 && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" paragraph>
                  No transactions found.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNewTransaction}
                >
                  Create Your First Transaction
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <TransactionSummary
          transactions={transactions}
          currencyRates={currencyRates}
        />
      </TabPanel>

      {/* New Transaction Dialog */}
      <Dialog
        open={showNewTransactionModal}
        onClose={() => setShowNewTransactionModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>New Transaction</DialogTitle>
        <DialogContent dividers>
          <TransactionForm
            onSubmit={handleSubmitTransaction}
            onCancel={() => setShowNewTransactionModal(false)}
            wallets={wallets}
            currencyRates={currencyRates}
            submitting={submitting}
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default Transactions;
