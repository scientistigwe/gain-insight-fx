// Chart objects
let balanceChart;
let monthlyChart;
let distributionChart;
let comparisonChart;

// Color scheme
const colors = {
  sent: "rgba(231, 76, 60, 0.8)",
  received: "rgba(46, 204, 113, 0.8)",
  balance: "rgba(52, 152, 219, 0.8)",
  projection: "rgba(155, 89, 182, 0.8)",
  background: {
    sent: "rgba(231, 76, 60, 0.2)",
    received: "rgba(46, 204, 113, 0.2)",
    balance: "rgba(52, 152, 219, 0.2)",
    projection: "rgba(155, 89, 182, 0.2)",
  },
};

// Update all charts
function updateCharts() {
  updateBalanceChart();
  updateMonthlyChart();
  updateDistributionChart();
  updateComparisonChart();
}

// Update balance history chart
function updateBalanceChart() {
  const ctx = document.getElementById("balance-chart").getContext("2d");

  // Prepare data
  const transactions = transactionManager.transactions;

  if (transactions.length === 0) {
    if (balanceChart) {
      balanceChart.destroy();
    }
    balanceChart = null;
    return;
  }

  // Sort transactions by date (oldest first)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const labels = sortedTransactions.map((transaction) =>
    formatDate(transaction.date)
  );
  const balanceData = sortedTransactions.map(
    (transaction) => transaction.balance
  );

  const data = {
    labels: labels,
    datasets: [
      {
        label: "Balance",
        data: balanceData,
        backgroundColor: colors.background.balance,
        borderColor: colors.balance,
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 3,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          maxTicksLimit: 10,
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: false,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Balance: ${formatCurrency(context.raw)}`;
          },
        },
      },
    },
  };

  // Create or update chart
  if (balanceChart) {
    balanceChart.data = data;
    balanceChart.options = options;
    balanceChart.update();
  } else {
    balanceChart = new Chart(ctx, {
      type: "line",
      data: data,
      options: options,
    });
  }
}

// Update monthly transactions chart
function updateMonthlyChart() {
  const ctx = document.getElementById("monthly-chart").getContext("2d");

  // Get monthly data
  const monthlyData = transactionManager.getMonthlyTotals();

  if (Object.keys(monthlyData).length === 0) {
    if (monthlyChart) {
      monthlyChart.destroy();
    }
    monthlyChart = null;
    return;
  }

  // Sort months chronologically
  const months = Object.keys(monthlyData).sort();

  // Format month labels (e.g., "2023-01" to "Jan 2023")
  const labels = months.map((month) => {
    const [year, monthNum] = month.split("-");
    const date = new Date(year, parseInt(monthNum) - 1, 1);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  });

  const sentData = months.map((month) => monthlyData[month].sent);
  const receivedData = months.map((month) => monthlyData[month].received);

  const data = {
    labels: labels,
    datasets: [
      {
        label: "Sent",
        data: sentData,
        backgroundColor: colors.sent,
        borderColor: colors.sent,
        borderWidth: 1,
        maxBarThickness: 30,
      },
      {
        label: "Received",
        data: receivedData,
        backgroundColor: colors.received,
        borderColor: colors.received,
        borderWidth: 1,
        maxBarThickness: 30,
      },
    ],
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
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return formatCurrency(value).replace(".00", "");
          },
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
          },
        },
      },
    },
  };

  // Create or update chart
  if (monthlyChart) {
    monthlyChart.data = data;
    monthlyChart.options = options;
    monthlyChart.update();
  } else {
    monthlyChart = new Chart(ctx, {
      type: "bar",
      data: data,
      options: options,
    });
  }
}

// Update transaction distribution chart
function updateDistributionChart() {
  const ctx = document.getElementById("distribution-chart").getContext("2d");

  const transactions = transactionManager.transactions;

  if (transactions.length === 0) {
    if (distributionChart) {
      distributionChart.destroy();
    }
    distributionChart = null;
    return;
  }

  // Count transactions by type
  let sentCount = 0;
  let receivedCount = 0;

  transactions.forEach((transaction) => {
    if (transaction.type === "sent") {
      sentCount++;
    } else {
      receivedCount++;
    }
  });

  const data = {
    labels: ["Sent", "Received"],
    datasets: [
      {
        data: [sentCount, receivedCount],
        backgroundColor: [colors.sent, colors.received],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label;
            const value = context.raw;
            const total = sentCount + receivedCount;
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Create or update chart
  if (distributionChart) {
    distributionChart.data = data;
    distributionChart.options = options;
    distributionChart.update();
  } else {
    distributionChart = new Chart(ctx, {
      type: "doughnut",
      data: data,
      options: options,
    });
  }
}

// Update monthly comparison chart
function updateComparisonChart() {
  const ctx = document.getElementById("comparison-chart").getContext("2d");

  // Get monthly data
  const monthlyData = transactionManager.getMonthlyTotals();

  if (Object.keys(monthlyData).length === 0) {
    if (comparisonChart) {
      comparisonChart.destroy();
    }
    comparisonChart = null;
    return;
  }

  // Sort months chronologically
  const months = Object.keys(monthlyData).sort();

  // Format month labels
  const labels = months.map((month) => {
    const [year, monthNum] = month.split("-");
    const date = new Date(year, parseInt(monthNum) - 1, 1);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  });

  const netData = months.map((month) => monthlyData[month].net);

  const data = {
    labels: labels,
    datasets: [
      {
        label: "Net Cash Flow",
        data: netData,
        backgroundColor: netData.map((value) =>
          value >= 0 ? colors.received : colors.sent
        ),
        borderColor: netData.map((value) =>
          value >= 0 ? colors.received : colors.sent
        ),
        borderWidth: 1,
        maxBarThickness: 30,
      },
    ],
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
        beginAtZero: false,
        ticks: {
          callback: function (value) {
            return formatCurrency(value).replace(".00", "");
          },
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Net: ${formatCurrency(context.raw)}`;
          },
        },
      },
    },
  };

  // Create or update chart
  if (comparisonChart) {
    comparisonChart.data = data;
    comparisonChart.options = options;
    comparisonChart.update();
  } else {
    comparisonChart = new Chart(ctx, {
      type: "bar",
      data: data,
      options: options,
    });
  }
}
