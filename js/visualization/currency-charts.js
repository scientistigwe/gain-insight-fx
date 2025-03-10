/**
 * Currency Charts - Specialized charts for currency exchange rate analysis
 */

// Chart objects
let rateHistoryChart;
let rateTrendChart;
let currencyPerformanceChart;
let profitLossChart;
let opportunityChart;

// Color scheme with improved contrast for chart readability
const currencyColors = {
  USD: "rgba(31, 119, 180, 0.8)", // Blue
  GBP: "rgba(44, 160, 44, 0.8)", // Green
  EUR: "rgba(214, 39, 40, 0.8)", // Red
  NGN: "rgba(255, 127, 14, 0.8)", // Orange
  background: {
    USD: "rgba(31, 119, 180, 0.2)",
    GBP: "rgba(44, 160, 44, 0.2)",
    EUR: "rgba(214, 39, 40, 0.2)",
    NGN: "rgba(255, 127, 14, 0.2)",
  },
  positive: "rgba(44, 160, 44, 0.8)", // Green
  negative: "rgba(214, 39, 40, 0.8)", // Red
  neutral: "rgba(31, 119, 180, 0.8)", // Blue
};

/**
 * Initialize all currency charts
 */
function initCurrencyCharts() {
  // Create chart containers if they don't exist
  ensureChartContainers();

  // Initialize empty charts
  createEmptyCharts();
}

/**
 * Ensure all chart containers exist
 */
function ensureChartContainers() {
  const chartContainers = [
    { id: "rate-history-chart", title: "Exchange Rate History" },
    { id: "rate-trend-chart", title: "Rate Trend Analysis" },
    { id: "currency-performance-chart", title: "Currency Performance" },
    { id: "profit-loss-chart", title: "Profit/Loss Analysis" },
    { id: "opportunity-chart", title: "Trading Opportunities" },
  ];

  const currencyAnalyticsSection =
    document.getElementById("currency-analytics");

  if (!currencyAnalyticsSection) {
    console.error("Currency analytics section not found");
    return;
  }

  // Create any missing chart containers
  chartContainers.forEach((container) => {
    if (!document.getElementById(container.id)) {
      const chartContainer = document.createElement("div");
      chartContainer.className = "chart-container";

      const title = document.createElement("h3");
      title.textContent = container.title;

      const canvas = document.createElement("canvas");
      canvas.id = container.id;

      chartContainer.appendChild(title);
      chartContainer.appendChild(canvas);

      currencyAnalyticsSection.appendChild(chartContainer);
    }
  });
}

/**
 * Create empty charts with placeholders
 */
function createEmptyCharts() {
  const placeholderData = {
    labels: ["No Data Available"],
    datasets: [
      {
        label: "No Data",
        data: [0],
        backgroundColor: "rgba(200, 200, 200, 0.2)",
        borderColor: "rgba(200, 200, 200, 0.8)",
      },
    ],
  };

  const placeholderOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function () {
            return "No data available";
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          display: false,
        },
      },
      x: {
        ticks: {
          display: false,
        },
      },
    },
  };

  // Initialize charts with placeholders
  const rateHistoryCtx = document
    .getElementById("rate-history-chart")
    ?.getContext("2d");
  const rateTrendCtx = document
    .getElementById("rate-trend-chart")
    ?.getContext("2d");
  const currencyPerformanceCtx = document
    .getElementById("currency-performance-chart")
    ?.getContext("2d");
  const profitLossCtx = document
    .getElementById("profit-loss-chart")
    ?.getContext("2d");
  const opportunityCtx = document
    .getElementById("opportunity-chart")
    ?.getContext("2d");

  if (rateHistoryCtx) {
    rateHistoryChart = new Chart(rateHistoryCtx, {
      type: "line",
      data: placeholderData,
      options: placeholderOptions,
    });
  }

  if (rateTrendCtx) {
    rateTrendChart = new Chart(rateTrendCtx, {
      type: "line",
      data: placeholderData,
      options: placeholderOptions,
    });
  }

  if (currencyPerformanceCtx) {
    currencyPerformanceChart = new Chart(currencyPerformanceCtx, {
      type: "bar",
      data: placeholderData,
      options: placeholderOptions,
    });
  }

  if (profitLossCtx) {
    profitLossChart = new Chart(profitLossCtx, {
      type: "bar",
      data: placeholderData,
      options: placeholderOptions,
    });
  }

  if (opportunityCtx) {
    opportunityChart = new Chart(opportunityCtx, {
      type: "radar",
      data: placeholderData,
      options: placeholderOptions,
    });
  }
}

/**
 * Update all currency charts with data
 * @param {Object} currencyManager - The currency manager instance
 * @param {Object} transactionManager - The transaction manager instance
 */
function updateCurrencyCharts(currencyManager, transactionManager) {
  if (!currencyManager || !transactionManager) {
    console.error("Currency or Transaction manager not provided");
    return;
  }

  updateRateHistoryChart(currencyManager);
  updateRateTrendChart(currencyManager);
  updateCurrencyPerformanceChart(transactionManager);
  updateProfitLossChart(transactionManager);
  updateOpportunityChart(currencyManager);
}

/**
 * Update exchange rate history chart
 * @param {Object} currencyManager - The currency manager instance
 */
function updateRateHistoryChart(currencyManager) {
  const ctx = document.getElementById("rate-history-chart")?.getContext("2d");
  if (!ctx) return;

  const historicalRates = currencyManager.historicalRates;
  const currencies = currencyManager.currencies;

  if (!historicalRates || Object.keys(historicalRates).length === 0) {
    // No data available, keep placeholder
    return;
  }

  // Prepare datasets for each currency
  const datasets = [];

  currencies.forEach((currency) => {
    if (!historicalRates[currency] || historicalRates[currency].length === 0) {
      return;
    }

    // Sort by date
    const sortedRates = [...historicalRates[currency]].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Only keep one data point per day to avoid cluttering
    const dailyRates = [];
    const dateMap = {};

    sortedRates.forEach((item) => {
      const dateStr = new Date(item.date).toISOString().split("T")[0];
      dateMap[dateStr] = item;
    });

    Object.values(dateMap).forEach((item) => {
      dailyRates.push(item);
    });

    datasets.push({
      label: `${currency}/NGN`,
      data: dailyRates.map((item) => ({
        x: item.date,
        y: item.rate,
      })),
      borderColor: currencyColors[currency],
      backgroundColor: currencyColors.background[currency],
      borderWidth: 2,
      tension: 0.3,
      pointRadius: 1,
      pointHoverRadius: 5,
      fill: false,
    });
  });

  const data = {
    datasets: datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "nearest",
      intersect: false,
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: "day",
          tooltipFormat: "MMM d, yyyy",
          displayFormats: {
            day: "MMM d",
          },
        },
        title: {
          display: true,
          text: "Date",
        },
      },
      y: {
        title: {
          display: true,
          text: "Exchange Rate (NGN)",
        },
        ticks: {
          callback: function (value) {
            return value.toFixed(2);
          },
        },
      },
    },
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            return `${label}: ${value.toFixed(2)} NGN`;
          },
        },
      },
    },
  };

  // Create or update chart
  if (rateHistoryChart) {
    rateHistoryChart.data = data;
    rateHistoryChart.options = options;
    rateHistoryChart.update();
  } else {
    rateHistoryChart = new Chart(ctx, {
      type: "line",
      data: data,
      options: options,
    });
  }
}

/**
 * Update rate trend analysis chart
 * @param {Object} currencyManager - The currency manager instance
 */
function updateRateTrendChart(currencyManager) {
  const ctx = document.getElementById("rate-trend-chart")?.getContext("2d");
  if (!ctx) return;

  const currencies = currencyManager.currencies;

  // Get trend analysis for each currency
  const trendData = {};
  const trendLabels = [
    "Current Rate",
    "7-Day Forecast",
    "14-Day Forecast",
    "30-Day Forecast",
  ];

  currencies.forEach((currency) => {
    const trend = currencyManager.getTrendAnalysis(currency);
    if (trend) {
      trendData[currency] = trend;
    }
  });

  if (Object.keys(trendData).length === 0) {
    // No data available, keep placeholder
    return;
  }

  // Prepare datasets
  const datasets = [];

  currencies.forEach((currency) => {
    if (!trendData[currency]) return;

    const trend = trendData[currency];
    const prediction = currencyManager.predictFutureRate(currency, 30);

    // Create forecast points at 7, 14, and 30 days
    const day7Prediction = currencyManager.predictFutureRate(currency, 7);
    const day14Prediction = currencyManager.predictFutureRate(currency, 14);
    const day30Prediction = currencyManager.predictFutureRate(currency, 30);

    // Calculate rate change percentage for coloring
    const currentToForecast =
      ((prediction.rate - trend.currentRate) / trend.currentRate) * 100;
    const borderColor =
      currentToForecast > 1
        ? currencyColors.positive
        : currentToForecast < -1
        ? currencyColors.negative
        : currencyColors.neutral;

    datasets.push({
      label: `${currency}/NGN`,
      data: [
        trend.currentRate,
        day7Prediction.rate,
        day14Prediction.rate,
        day30Prediction.rate,
      ],
      borderColor: borderColor,
      backgroundColor: currencyColors.background[currency],
      borderWidth: 2,
      pointStyle: "circle",
      pointRadius: 6,
      pointHoverRadius: 8,
      fill: false,
    });
  });

  const data = {
    labels: trendLabels,
    datasets: datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        title: {
          display: true,
          text: "Exchange Rate (NGN)",
        },
        ticks: {
          callback: function (value) {
            return value.toFixed(2);
          },
        },
      },
    },
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            return `${label}: ${value.toFixed(2)} NGN`;
          },
          afterLabel: function (context) {
            const currencyCode = context.dataset.label.split("/")[0];
            const index = context.dataIndex;

            if (index === 0) {
              return "Current market rate";
            } else {
              const trend = trendData[currencyCode];
              const dayCount = index === 1 ? 7 : index === 2 ? 14 : 30;
              const prediction = currencyManager.predictFutureRate(
                currencyCode,
                dayCount
              );
              const change = (
                ((prediction.rate - trend.currentRate) / trend.currentRate) *
                100
              ).toFixed(2);
              const direction = change > 0 ? "increase" : "decrease";
              return `Forecast: ${Math.abs(
                change
              )}% ${direction} in ${dayCount} days (Confidence: ${(
                prediction.confidence * 100
              ).toFixed(0)}%)`;
            }
          },
        },
      },
    },
  };

  // Create or update chart
  if (rateTrendChart) {
    rateTrendChart.data = data;
    rateTrendChart.options = options;
    rateTrendChart.update();
  } else {
    rateTrendChart = new Chart(ctx, {
      type: "line",
      data: data,
      options: options,
    });
  }
}

/**
 * Update currency performance chart
 * @param {Object} transactionManager - The transaction manager instance
 */
function updateCurrencyPerformanceChart(transactionManager) {
  const ctx = document
    .getElementById("currency-performance-chart")
    ?.getContext("2d");
  if (!ctx) return;

  const analytics = transactionManager.getAnalyticsData();

  if (
    !analytics ||
    !analytics.currencyPerformance ||
    Object.keys(analytics.currencyPerformance).length === 0
  ) {
    // No data available, keep placeholder
    return;
  }

  // Extract performance data
  const currencies = Object.keys(analytics.currencyPerformance);
  const performanceData = currencies.map((currency) => {
    const data = analytics.currencyPerformance[currency];
    return {
      currency: currency,
      change: data.change,
      oldRate: data.oldestRate,
      newRate: data.newestRate,
    };
  });

  // Sort by change percentage (desc)
  performanceData.sort((a, b) => b.change - a.change);

  const data = {
    labels: performanceData.map((item) => `${item.currency}/NGN`),
    datasets: [
      {
        label: "Rate Change (%)",
        data: performanceData.map((item) => item.change),
        backgroundColor: performanceData.map((item) =>
          item.change > 0 ? currencyColors.positive : currencyColors.negative
        ),
        borderColor: performanceData.map((item) =>
          item.change > 0 ? currencyColors.positive : currencyColors.negative
        ),
        borderWidth: 1,
        maxBarThickness: 50,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    scales: {
      x: {
        title: {
          display: true,
          text: "Change Percentage (%)",
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const currency = performanceData[context.dataIndex].currency;
            const change = context.parsed.x.toFixed(2);
            const oldRate =
              performanceData[context.dataIndex].oldRate.toFixed(2);
            const newRate =
              performanceData[context.dataIndex].newRate.toFixed(2);

            return [
              `Change: ${change}%`,
              `From: ${oldRate} NGN`,
              `To: ${newRate} NGN`,
            ];
          },
        },
      },
    },
  };

  // Create or update chart
  if (currencyPerformanceChart) {
    currencyPerformanceChart.data = data;
    currencyPerformanceChart.options = options;
    currencyPerformanceChart.update();
  } else {
    currencyPerformanceChart = new Chart(ctx, {
      type: "bar",
      data: data,
      options: options,
    });
  }
}

/**
 * Update profit/loss analysis chart
 * @param {Object} transactionManager - The transaction manager instance
 */
function updateProfitLossChart(transactionManager) {
  const ctx = document.getElementById("profit-loss-chart")?.getContext("2d");
  if (!ctx) return;

  const monthlyTotals = transactionManager.getMonthlyTotals();
  const months = Object.keys(monthlyTotals).sort();

  if (months.length === 0) {
    // No data available, keep placeholder
    return;
  }

  // Get the last 6 months (or all if less than 6)
  const recentMonths = months.slice(-6);

  // Format labels (e.g., "2023-01" to "Jan 2023")
  const labels = recentMonths.map((month) => {
    const [year, monthNum] = month.split("-");
    const date = new Date(year, parseInt(monthNum) - 1, 1);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  });

  // Prepare datasets for profit/loss by currency
  const currencySets = {};

  recentMonths.forEach((month) => {
    const data = monthlyTotals[month];

    if (data && data.byCurrency) {
      Object.keys(data.byCurrency).forEach((currency) => {
        if (!currencySets[currency]) {
          currencySets[currency] = recentMonths.map(() => 0);
        }

        const monthIndex = recentMonths.indexOf(month);
        if (monthIndex !== -1) {
          currencySets[currency][monthIndex] = data.byCurrency[currency].net;
        }
      });
    }
  });

  // Create datasets
  const datasets = Object.keys(currencySets).map((currency) => {
    return {
      label: currency,
      data: currencySets[currency],
      backgroundColor: currencyColors[currency] || currencyColors.neutral,
      borderColor: currencyColors[currency] || currencyColors.neutral,
      borderWidth: 1,
      maxBarThickness: 30,
    };
  });

  const data = {
    labels: labels,
    datasets: datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        title: {
          display: true,
          text: "Profit/Loss",
        },
        ticks: {
          callback: function (value) {
            return value.toFixed(0);
          },
        },
      },
    },
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const currency = context.dataset.label;
            const value = context.parsed.y;
            const formattedValue = Math.abs(value).toFixed(2);

            if (value > 0) {
              return `${currency} Profit: ${formattedValue}`;
            } else if (value < 0) {
              return `${currency} Loss: ${formattedValue}`;
            } else {
              return `${currency}: ${formattedValue}`;
            }
          },
        },
      },
    },
  };

  // Create or update chart
  if (profitLossChart) {
    profitLossChart.data = data;
    profitLossChart.options = options;
    profitLossChart.update();
  } else {
    profitLossChart = new Chart(ctx, {
      type: "bar",
      data: data,
      options: options,
    });
  }
}

/**
 * Update trading opportunity chart
 * @param {Object} currencyManager - The currency manager instance
 */
function updateOpportunityChart(currencyManager) {
  const ctx = document.getElementById("opportunity-chart")?.getContext("2d");
  if (!ctx) return;

  const currencies = currencyManager.currencies;

  // Get trend analysis for each currency
  const opportunityScores = {};

  currencies.forEach((currency) => {
    const trend = currencyManager.getTrendAnalysis(currency);
    if (!trend) return;

    // Calculate buy opportunity score (higher = better to buy foreign currency)
    // Factors: rate decreasing, low volatility, rate below average
    const buyFactors = {
      trend:
        trend.trend === "falling" ? 100 : trend.trend === "stable" ? 50 : 0,
      volatility: 100 - Math.min(100, trend.volatility * 100),
      rateVsAvg:
        trend.currentRate < trend.avg
          ? Math.min(100, ((trend.avg - trend.currentRate) / trend.avg) * 500)
          : 0,
    };

    const buyScore =
      buyFactors.trend * 0.4 +
      buyFactors.volatility * 0.2 +
      buyFactors.rateVsAvg * 0.4;

    // Calculate sell opportunity score (higher = better to sell foreign currency)
    // Factors: rate increasing, low volatility, rate above average
    const sellFactors = {
      trend: trend.trend === "rising" ? 100 : trend.trend === "stable" ? 50 : 0,
      volatility: 100 - Math.min(100, trend.volatility * 100),
      rateVsAvg:
        trend.currentRate > trend.avg
          ? Math.min(100, ((trend.currentRate - trend.avg) / trend.avg) * 500)
          : 0,
    };

    const sellScore =
      sellFactors.trend * 0.4 +
      sellFactors.volatility * 0.2 +
      sellFactors.rateVsAvg * 0.4;

    // Calculate hold score (higher = better to hold currency)
    // Factors: stable or slightly rising, low volatility
    const holdFactors = {
      trend:
        trend.trend === "stable" ? 100 : trend.trend === "rising" ? 70 : 30,
      volatility: 100 - Math.min(100, trend.volatility * 100),
      prediction:
        trend.predictedRate > trend.currentRate
          ? Math.min(
              100,
              ((trend.predictedRate - trend.currentRate) / trend.currentRate) *
                300
            )
          : 0,
    };

    const holdScore =
      holdFactors.trend * 0.3 +
      holdFactors.volatility * 0.3 +
      holdFactors.prediction * 0.4;

    opportunityScores[currency] = {
      buy: Math.round(buyScore),
      sell: Math.round(sellScore),
      hold: Math.round(holdScore),
      currentRate: trend.currentRate,
      avgRate: trend.avg,
      trend: trend.trend,
    };
  });

  if (Object.keys(opportunityScores).length === 0) {
    // No data available, keep placeholder
    return;
  }

  // Create dataset for each currency
  const datasets = currencies
    .filter((currency) => opportunityScores[currency])
    .map((currency) => {
      const scores = opportunityScores[currency];
      return {
        label: currency,
        data: [scores.buy, scores.sell, scores.hold],
        backgroundColor: `${currencyColors[currency]}50`,
        borderColor: currencyColors[currency],
        borderWidth: 2,
        pointBackgroundColor: currencyColors[currency],
        pointRadius: 4,
      };
    });

  const data = {
    labels: ["Buy Foreign", "Sell Foreign", "Hold"],
    datasets: datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
        },
        pointLabels: {
          font: {
            size: 14,
            weight: "bold",
          },
        },
      },
    },
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const currency = context.dataset.label;
            const actionIndex = context.dataIndex;
            const score = context.parsed.r;

            const actions = ["Buy", "Sell", "Hold"];
            const action = actions[actionIndex];

            const currentRate =
              opportunityScores[currency].currentRate.toFixed(2);
            const avgRate = opportunityScores[currency].avgRate.toFixed(2);
            const trend = opportunityScores[currency].trend;

            return [
              `${currency} ${action} Score: ${score}/100`,
              `Current Rate: ${currentRate} NGN`,
              `Average Rate: ${avgRate} NGN`,
              `Trend: ${trend.charAt(0).toUpperCase() + trend.slice(1)}`,
            ];
          },
        },
      },
    },
  };

  // Create or update chart
  if (opportunityChart) {
    opportunityChart.data = data;
    opportunityChart.options = options;
    opportunityChart.update();
  } else {
    opportunityChart = new Chart(ctx, {
      type: "radar",
      data: data,
      options: options,
    });
  }
}

/**
 * Safely destroy all charts
 */
function destroyCurrencyCharts() {
  if (rateHistoryChart) {
    rateHistoryChart.destroy();
    rateHistoryChart = null;
  }

  if (rateTrendChart) {
    rateTrendChart.destroy();
    rateTrendChart = null;
  }

  if (currencyPerformanceChart) {
    currencyPerformanceChart.destroy();
    currencyPerformanceChart = null;
  }

  if (profitLossChart) {
    profitLossChart.destroy();
    profitLossChart = null;
  }

  if (opportunityChart) {
    opportunityChart.destroy();
    opportunityChart = null;
  }
}

// Export functions
window.currencyCharts = {
  initCurrencyCharts,
  updateCurrencyCharts,
  updateRateHistoryChart,
  updateRateTrendChart,
  updateCurrencyPerformanceChart,
  updateProfitLossChart,
  updateOpportunityChart,
  destroyCurrencyCharts,
};
