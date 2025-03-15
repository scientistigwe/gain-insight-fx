import React, { useState } from "react";
import {
  Container,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  LinearProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  formatCurrency,
  formatPercentage,
  formatDate,
} from "../../utils/formatters";
import { useAnalytics } from "../../context/AppProvider";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
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

const ChartContainer = styled(Box)(({ theme }) => ({
  height: 350,
  position: "relative",
}));

const StatItem = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const Analytics = () => {
  const [timeRange, setTimeRange] = useState(90); // days
  
  // Use the analytics context instead of local state and API calls
  const { 
    loading, 
    error, 
    profitLoss, 
    transactionStats, 
    currencyPerformance, 
    opportunities,
    fetchAnalyticsData 
  } = useAnalytics();

  const handleTimeRangeChange = (event) => {
    const newTimeRange = parseInt(event.target.value);
    setTimeRange(newTimeRange);
    fetchAnalyticsData(newTimeRange);
  };

  // Prepare profit/loss chart data
  const prepareProfitLossChartData = () => {
    if (!profitLoss || !profitLoss.monthly_data) return null;

    return {
      labels: profitLoss.monthly_data.map((item) => item.month),
      datasets: [
        {
          label: "Profit/Loss",
          data: profitLoss.monthly_data.map((item) => item.profit_loss),
          borderColor: "rgb(53, 162, 235)",
          backgroundColor: profitLoss.monthly_data.map((item) =>
            item.profit_loss >= 0
              ? "rgba(75, 192, 192, 0.5)"
              : "rgba(255, 99, 132, 0.5)"
          ),
        },
      ],
    };
  };

  // Prepare currency performance chart data
  const prepareCurrencyPerformanceChartData = () => {
    if (!currencyPerformance || !currencyPerformance.currencies) return null;

    return {
      labels: currencyPerformance.currencies.map((item) => item.code),
      datasets: [
        {
          label: "Performance",
          data: currencyPerformance.currencies.map(
            (item) => item.performance_percentage
          ),
          backgroundColor: currencyPerformance.currencies.map((item) =>
            item.performance_percentage >= 0
              ? "rgba(75, 192, 192, 0.5)"
              : "rgba(255, 99, 132, 0.5)"
          ),
          borderColor: currencyPerformance.currencies.map((item) =>
            item.performance_percentage >= 0
              ? "rgb(75, 192, 192)"
              : "rgb(255, 99, 132)"
          ),
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare transaction volume chart data
  const prepareTransactionVolumeChartData = () => {
    if (!transactionStats || !transactionStats.volume_by_currency) return null;

    const labels = Object.keys(transactionStats.volume_by_currency);
    const data = labels.map(
      (currency) => transactionStats.volume_by_currency[currency]
    );

    const backgroundColors = [
      "rgba(255, 99, 132, 0.5)",
      "rgba(54, 162, 235, 0.5)",
      "rgba(255, 206, 86, 0.5)",
      "rgba(75, 192, 192, 0.5)",
      "rgba(153, 102, 255, 0.5)",
      "rgba(255, 159, 64, 0.5)",
    ];

    return {
      labels,
      datasets: [
        {
          label: "Transaction Volume",
          data,
          backgroundColor: labels.map(
            (_, i) => backgroundColors[i % backgroundColors.length]
          ),
          borderWidth: 1,
        },
      ],
    };
  };

  if (loading && !profitLoss) {
    return (
      <LoadingContainer>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading analytics data...
        </Typography>
      </LoadingContainer>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        Analytics
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <Typography variant="body1">Time Range:</Typography>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <Select
                value={timeRange}
                onChange={handleTimeRangeChange}
                displayEmpty
              >
                <MenuItem value={30}>Last 30 Days</MenuItem>
                <MenuItem value={90}>Last 90 Days</MenuItem>
                <MenuItem value={180}>Last 6 Months</MenuItem>
                <MenuItem value={365}>Last Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }} elevation={2}>
            <CardHeader title="Profit/Loss Summary" />
            <CardContent>
              {profitLoss ? (
                <>
                  <StatItem>
                    <Typography variant="subtitle2" gutterBottom>
                      Total Profit/Loss
                    </Typography>
                    <Typography
                      variant="h4"
                      color={
                        profitLoss.total_profit_loss >= 0
                          ? "success.main"
                          : "error.main"
                      }
                    >
                      {profitLoss.total_profit_loss >= 0 ? "+" : ""}
                      {formatCurrency(profitLoss.total_profit_loss)}
                    </Typography>
                  </StatItem>

                  <StatItem>
                    <Typography variant="subtitle2" gutterBottom>
                      Best Performing Pair
                    </Typography>
                    <Typography variant="h6">
                      {profitLoss.best_performing_pair}
                      <Typography
                        component="span"
                        color="success.main"
                        sx={{ ml: 1 }}
                      >
                        (+{formatPercentage(profitLoss.best_performance)})
                      </Typography>
                    </Typography>
                  </StatItem>

                  <StatItem>
                    <Typography variant="subtitle2" gutterBottom>
                      Worst Performing Pair
                    </Typography>
                    <Typography variant="h6">
                      {profitLoss.worst_performing_pair}
                      <Typography
                        component="span"
                        color="error.main"
                        sx={{ ml: 1 }}
                      >
                        ({formatPercentage(profitLoss.worst_performance)})
                      </Typography>
                    </Typography>
                  </StatItem>
                </>
              ) : (
                <Box sx={{ textAlign: "center", py: 5 }}>
                  <Typography variant="body1" color="text.secondary">
                    No profit/loss data available.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ height: "100%" }} elevation={2}>
            <CardHeader title="Profit/Loss Trend" />
            <CardContent>
              {profitLoss && profitLoss.monthly_data ? (
                <ChartContainer>
                  <Bar
                    data={prepareProfitLossChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              const value = context.raw;
                              return `Profit/Loss: ${
                                value >= 0 ? "+" : ""
                              }${formatCurrency(value)}`;
                            },
                          },
                        },
                      },
                      scales: {
                        y: {
                          ticks: {
                            callback: function (value) {
                              return formatCurrency(value);
                            },
                          },
                        },
                      },
                    }}
                  />
                </ChartContainer>
              ) : (
                <Box sx={{ textAlign: "center", py: 5 }}>
                  <Typography variant="body1" color="text.secondary">
                    No profit/loss trend data available.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }} elevation={2}>
            <CardHeader title="Currency Performance" />
            <CardContent>
              {currencyPerformance && currencyPerformance.currencies ? (
                <ChartContainer>
                  <Bar
                    data={prepareCurrencyPerformanceChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      indexAxis: "y",
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              const value = context.raw;
                              return `Performance: ${
                                value >= 0 ? "+" : ""
                              }${formatPercentage(value)}`;
                            },
                          },
                        },
                      },
                      scales: {
                        x: {
                          ticks: {
                            callback: function (value) {
                              return formatPercentage(value);
                            },
                          },
                        },
                      },
                    }}
                  />
                </ChartContainer>
              ) : (
                <Box sx={{ textAlign: "center", py: 5 }}>
                  <Typography variant="body1" color="text.secondary">
                    No currency performance data available.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }} elevation={2}>
            <CardHeader title="Transaction Volume by Currency" />
            <CardContent>
              {transactionStats && transactionStats.volume_by_currency ? (
                <ChartContainer>
                  <Pie
                    data={prepareTransactionVolumeChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "right",
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              const value = context.raw;
                              const total = context.dataset.data.reduce(
                                (a, b) => a + b,
                                0
                              );
                              const percentage = (
                                (value / total) *
                                100
                              ).toFixed(2);
                              return `${context.label}: ${formatCurrency(
                                value
                              )} (${percentage}%)`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </ChartContainer>
              ) : (
                <Box sx={{ textAlign: "center", py: 5 }}>
                  <Typography variant="body1" color="text.secondary">
                    No transaction volume data available.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardHeader title="Exchange Opportunities" />
            <CardContent>
              {opportunities && opportunities.opportunities ? (
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Currency Pair</TableCell>
                        <TableCell>Current Rate</TableCell>
                        <TableCell>Recommendation</TableCell>
                        <TableCell>Potential Gain</TableCell>
                        <TableCell>Confidence</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {opportunities.opportunities.map((opportunity, index) => (
                        <TableRow key={index} hover>
                          <TableCell>{opportunity.currency_pair}</TableCell>
                          <TableCell>
                            {formatCurrency(opportunity.current_rate)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={opportunity.action}
                              color={
                                opportunity.action === "BUY"
                                  ? "success"
                                  : opportunity.action === "SELL"
                                  ? "error"
                                  : "default"
                              }
                              size="small"
                              sx={{ mb: 1 }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              {opportunity.reason}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ color: "success.main" }}>
                            {formatPercentage(opportunity.potential_gain)}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ width: "100%", mr: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={opportunity.confidence}
                                color={
                                  opportunity.confidence >= 70
                                    ? "success"
                                    : opportunity.confidence >= 40
                                    ? "warning"
                                    : "error"
                                }
                                sx={{ height: 10, borderRadius: 5 }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                align="center"
                                display="block"
                                sx={{ mt: 0.5 }}
                              >
                                {opportunity.confidence}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              size="small"
                              component={RouterLink}
                              to={`/transactions/new?from=${opportunity.from_currency_id}&to=${opportunity.to_currency_id}`}
                            >
                              Create Transaction
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No exchange opportunities available at this time.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Analytics;