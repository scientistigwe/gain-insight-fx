import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Button,
  ButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  getCurrentRates,
  getHistoricalRates,
  getTrends,
} from "../../api/currencies";
import { createAlert } from "../../api/alerts";
import { formatCurrency, formatDateTime } from "../../utils/formatters";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Styled components
const LoadingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flexDirection: "column",
  minHeight: "50vh",
}));

const CurrencyListItem = styled(ListItem)(({ theme, selected }) => ({
  cursor: "pointer",
  backgroundColor: selected ? theme.palette.action.selected : "transparent",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const ChartContainer = styled(Box)(({ theme }) => ({
  height: 400,
  position: "relative",
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: "none",
}));

const TrendStatCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
  height: "100%",
}));

const Currencies = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currencyRates, setCurrencyRates] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [trendData, setTrendData] = useState(null);
  const [timeRange, setTimeRange] = useState(30); // days
  const [alertThreshold, setAlertThreshold] = useState("");
  const [isAboveThreshold, setIsAboveThreshold] = useState(true);
  const [alertSuccess, setAlertSuccess] = useState("");
  const [alertError, setAlertError] = useState("");
  const [tabValue, setTabValue] = useState(0);

  // Fetch current rates on component mount
  useEffect(() => {
    const fetchCurrentRates = async () => {
      setLoading(true);
      try {
        const response = await getCurrentRates();
        setCurrencyRates(response.data);

        // Set first currency as default selected currency
        if (response.data.length > 0 && !selectedCurrency) {
          const defaultCurrency = response.data[0].quote_currency;
          setSelectedCurrency(defaultCurrency);
          fetchCurrencyDetails(defaultCurrency.code);
        }
      } catch (err) {
        console.error("Error fetching currency rates:", err);
        setError("Failed to load currency data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentRates();
  }, []);

  // Fetch historical data and trends for selected currency
  const fetchCurrencyDetails = async (currencyCode) => {
    setLoading(true);
    try {
      const [historicalResponse, trendResponse] = await Promise.all([
        getHistoricalRates(currencyCode, timeRange),
        getTrends(currencyCode, timeRange),
      ]);

      setHistoricalData(historicalResponse.data);
      setTrendData(trendResponse.data);
    } catch (err) {
      console.error(`Error fetching details for ${currencyCode}:`, err);
      setError(`Failed to load ${currencyCode} data. Please try again later.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencySelect = (currency) => {
    setSelectedCurrency(currency);
    fetchCurrencyDetails(currency.code);
  };

  const handleTimeRangeChange = (days) => {
    setTimeRange(days);
    if (selectedCurrency) {
      fetchCurrencyDetails(selectedCurrency.code);
    }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();

    if (!selectedCurrency || !alertThreshold) {
      setAlertError("Please select a currency and enter a threshold value");
      return;
    }

    try {
      await createAlert({
        base_currency_id: selectedCurrency.id,
        quote_currency_id: 1, // Assuming NGN is ID 1, adjust as needed
        threshold: parseFloat(alertThreshold),
        is_above_threshold: isAboveThreshold,
      });

      setAlertSuccess(
        `Alert created successfully for NGN/${selectedCurrency.code}`
      );
      setAlertThreshold("");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setAlertSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Error creating alert:", err);
      setAlertError(
        err.response?.data?.detail ||
          "Failed to create alert. Please try again."
      );
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Prepare historical data for chart
  const chartData = {
    labels: historicalData.map((item) =>
      new Date(item.timestamp).toLocaleDateString()
    ),
    datasets: [
      {
        label: selectedCurrency
          ? `NGN/${selectedCurrency.code} Exchange Rate`
          : "Exchange Rate",
        data: historicalData.map((item) => item.rate),
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: selectedCurrency
          ? `NGN/${selectedCurrency.code} Exchange Rate History`
          : "Exchange Rate History",
      },
    },
    scales: {
      y: {
        ticks: {
          callback: function (value) {
            return "₦" + value.toLocaleString();
          },
        },
      },
    },
  };

  if (loading && !currencyRates.length) {
    return (
      <LoadingContainer>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading currency data...
        </Typography>
      </LoadingContainer>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Currency Exchange Rates
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardHeader title="Select Currency" />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <List
                sx={{
                  maxHeight: "400px",
                  overflow: "auto",
                  p: 0,
                }}
                disablePadding
              >
                {currencyRates.map((rate) => (
                  <CurrencyListItem
                    key={rate.quote_currency.id}
                    selected={selectedCurrency?.id === rate.quote_currency.id}
                    onClick={() => handleCurrencySelect(rate.quote_currency)}
                    disablePadding
                  >
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="body1" fontWeight="medium">
                            {rate.quote_currency.code}
                          </Typography>
                          <Typography variant="body1">
                            ₦{formatCurrency(rate.rate)}
                          </Typography>
                        </Box>
                      }
                      secondary={rate.quote_currency.name}
                    />
                  </CurrencyListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {selectedCurrency && (
            <Card elevation={2}>
              <CardHeader title="Set Alert" />
              <Divider />
              <CardContent>
                {alertSuccess && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {alertSuccess}
                  </Alert>
                )}
                {alertError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {alertError}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleCreateAlert}>
                  <Typography variant="body2" gutterBottom>
                    Alert me when NGN/{selectedCurrency.code} is:
                  </Typography>

                  <Box sx={{ display: "flex", mb: 2 }}>
                    <FormControl sx={{ minWidth: 100, mr: 1 }}>
                      <Select
                        value={isAboveThreshold.toString()}
                        onChange={(e) =>
                          setIsAboveThreshold(e.target.value === "true")
                        }
                        size="small"
                      >
                        <MenuItem value="true">Above</MenuItem>
                        <MenuItem value="false">Below</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      type="number"
                      placeholder="Threshold value"
                      value={alertThreshold}
                      onChange={(e) => setAlertThreshold(e.target.value)}
                      inputProps={{ step: "0.01", min: "0" }}
                      required
                      size="small"
                      fullWidth
                    />
                  </Box>

                  <Button variant="contained" type="submit" fullWidth>
                    Create Alert
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid item xs={12} md={9}>
          {selectedCurrency ? (
            <>
              <Card elevation={2} sx={{ mb: 3 }}>
                <CardHeader
                  title={
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="h6">
                        {selectedCurrency.name} ({selectedCurrency.code})
                      </Typography>
                      <ButtonGroup size="small">
                        <Button
                          variant={timeRange === 7 ? "contained" : "outlined"}
                          onClick={() => handleTimeRangeChange(7)}
                        >
                          1W
                        </Button>
                        <Button
                          variant={timeRange === 30 ? "contained" : "outlined"}
                          onClick={() => handleTimeRangeChange(30)}
                        >
                          1M
                        </Button>
                        <Button
                          variant={timeRange === 90 ? "contained" : "outlined"}
                          onClick={() => handleTimeRangeChange(90)}
                        >
                          3M
                        </Button>
                        <Button
                          variant={timeRange === 365 ? "contained" : "outlined"}
                          onClick={() => handleTimeRangeChange(365)}
                        >
                          1Y
                        </Button>
                      </ButtonGroup>
                    </Box>
                  }
                />
                <Divider />
                <CardContent>
                  {loading ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", py: 5 }}
                    >
                      <CircularProgress />
                    </Box>
                  ) : (
                    <ChartContainer>
                      <Line data={chartData} options={chartOptions} />
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              <Box sx={{ width: "100%" }}>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                  <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="currency tabs"
                  >
                    <StyledTab label="Trend Analysis" id="tab-0" />
                    <StyledTab label="Historical Data" id="tab-1" />
                  </Tabs>
                </Box>

                {/* Trend Analysis Tab */}
                <Box
                  role="tabpanel"
                  hidden={tabValue !== 0}
                  id="tabpanel-0"
                  sx={{ pt: 2 }}
                >
                  {tabValue === 0 && (
                    <Card elevation={2}>
                      <CardContent>
                        {trendData ? (
                          <>
                            <Grid container spacing={3} sx={{ mb: 3 }}>
                              <Grid item xs={12} md={4}>
                                <TrendStatCard>
                                  <Typography
                                    variant="subtitle2"
                                    color="text.secondary"
                                    gutterBottom
                                  >
                                    Current Rate
                                  </Typography>
                                  <Typography variant="h4" gutterBottom>
                                    ₦{formatCurrency(trendData.current_rate)}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    As of {formatDateTime(trendData.timestamp)}
                                  </Typography>
                                </TrendStatCard>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <TrendStatCard>
                                  <Typography
                                    variant="subtitle2"
                                    color="text.secondary"
                                    gutterBottom
                                  >
                                    Average ({timeRange} days)
                                  </Typography>
                                  <Typography variant="h4" gutterBottom>
                                    ₦{formatCurrency(trendData.average_rate)}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color={
                                      trendData.current_rate >
                                      trendData.average_rate
                                        ? "error"
                                        : "success.main"
                                    }
                                  >
                                    {trendData.current_rate >
                                    trendData.average_rate
                                      ? "Above"
                                      : "Below"}{" "}
                                    average
                                  </Typography>
                                </TrendStatCard>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <TrendStatCard>
                                  <Typography
                                    variant="subtitle2"
                                    color="text.secondary"
                                    gutterBottom
                                  >
                                    Volatility
                                  </Typography>
                                  <Typography variant="h4" gutterBottom>
                                    {formatCurrency(trendData.volatility * 100)}
                                    %
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Standard deviation over period
                                  </Typography>
                                </TrendStatCard>
                              </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="h6" gutterBottom>
                              Trend Insights
                            </Typography>
                            <List>
                              <ListItem>
                                <ListItemText
                                  primary={
                                    <Box component="span">
                                      <Typography
                                        component="span"
                                        fontWeight="medium"
                                      >
                                        Trend direction:
                                      </Typography>{" "}
                                      {trendData.trend_direction}
                                    </Box>
                                  }
                                />
                              </ListItem>
                              <ListItem>
                                <ListItemText
                                  primary={
                                    <Box component="span">
                                      <Typography
                                        component="span"
                                        fontWeight="medium"
                                      >
                                        Change:
                                      </Typography>{" "}
                                      <Typography
                                        component="span"
                                        color={
                                          trendData.percent_change >= 0
                                            ? "error.main"
                                            : "success.main"
                                        }
                                      >
                                        {trendData.percent_change >= 0
                                          ? "+"
                                          : ""}
                                        {formatCurrency(
                                          trendData.percent_change
                                        )}
                                        %
                                      </Typography>{" "}
                                      over {timeRange} days
                                    </Box>
                                  }
                                />
                              </ListItem>
                              <ListItem>
                                <ListItemText
                                  primary={
                                    <Box component="span">
                                      <Typography
                                        component="span"
                                        fontWeight="medium"
                                      >
                                        Highest rate:
                                      </Typography>{" "}
                                      ₦{formatCurrency(trendData.highest_rate)}{" "}
                                      on{" "}
                                      {new Date(
                                        trendData.highest_rate_date
                                      ).toLocaleDateString()}
                                    </Box>
                                  }
                                />
                              </ListItem>
                              <ListItem>
                                <ListItemText
                                  primary={
                                    <Box component="span">
                                      <Typography
                                        component="span"
                                        fontWeight="medium"
                                      >
                                        Lowest rate:
                                      </Typography>{" "}
                                      ₦{formatCurrency(trendData.lowest_rate)}{" "}
                                      on{" "}
                                      {new Date(
                                        trendData.lowest_rate_date
                                      ).toLocaleDateString()}
                                    </Box>
                                  }
                                />
                              </ListItem>
                            </List>

                            <Paper
                              variant="outlined"
                              sx={{
                                p: 3,
                                mt: 3,
                                backgroundColor: "rgba(0, 0, 0, 0.02)",
                              }}
                            >
                              <Typography variant="subtitle1" gutterBottom>
                                Recommendation
                              </Typography>
                              <Typography variant="body2">
                                {trendData.recommendation}
                              </Typography>
                            </Paper>
                          </>
                        ) : (
                          <Box sx={{ textAlign: "center", py: 4 }}>
                            <Typography variant="body1" color="text.secondary">
                              Trend data not available. Please try a different
                              time range.
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </Box>

                {/* Historical Data Tab */}
                <Box
                  role="tabpanel"
                  hidden={tabValue !== 1}
                  id="tabpanel-1"
                  sx={{ pt: 2 }}
                >
                  {tabValue === 1 && (
                    <Card elevation={2}>
                      <CardContent sx={{ p: 0 }}>
                        <TableContainer sx={{ maxHeight: 400 }}>
                          <Table stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>
                                  Rate (NGN/{selectedCurrency.code})
                                </TableCell>
                                <TableCell>Change</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {historicalData.map((item, index) => {
                                const prevRate =
                                  index < historicalData.length - 1
                                    ? historicalData[index + 1].rate
                                    : item.rate;
                                const change = item.rate - prevRate;
                                const percentChange = (change / prevRate) * 100;

                                return (
                                  <TableRow key={item.timestamp} hover>
                                    <TableCell>
                                      {new Date(
                                        item.timestamp
                                      ).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                      ₦{formatCurrency(item.rate)}
                                    </TableCell>
                                    <TableCell
                                      sx={{
                                        color:
                                          change === 0
                                            ? "text.primary"
                                            : change > 0
                                            ? "error.main"
                                            : "success.main",
                                      }}
                                    >
                                      {change === 0 ? (
                                        "No change"
                                      ) : (
                                        <>
                                          {change > 0 ? "+" : ""}
                                          {formatCurrency(change)} (
                                          {percentChange.toFixed(2)}%)
                                        </>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  )}
                </Box>
              </Box>
            </>
          ) : (
            <Card sx={{ textAlign: "center", py: 5 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Select a currency to view details
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Choose a currency from the list to view exchange rates,
                  historical data, and trend analysis.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Currencies;
