// Projection chart object
let projectionChart;

// Update prediction data and visualizations
function updatePredictions() {
  const predictions = transactionManager.getPredictiveData();

  // Update prediction values
  document.getElementById("predicted-sent").textContent = formatCurrency(
    predictions.projectedSent
  );
  document.getElementById("predicted-received").textContent = formatCurrency(
    predictions.projectedReceived
  );
  document.getElementById("predicted-net").textContent = formatCurrency(
    predictions.projectedNet
  );

  // Update balance projection values
  const trend = predictions.futureTrend;
  if (trend.length > 0) {
    document.getElementById("current-balance").textContent = formatCurrency(
      trend[0].balance
    );

    if (trend.length > 1) {
      document.getElementById("month1-balance").textContent = formatCurrency(
        trend[1].balance
      );
    }

    if (trend.length > 2) {
      document.getElementById("month2-balance").textContent = formatCurrency(
        trend[2].balance
      );
    }

    if (trend.length > 3) {
      document.getElementById("month3-balance").textContent = formatCurrency(
        trend[3].balance
      );
    }
  }

  // Update projection chart
  updateProjectionChart(predictions.futureTrend);
}

// Update balance projection chart
function updateProjectionChart(trendData) {
  const ctx = document.getElementById("projection-chart").getContext("2d");

  if (!trendData || trendData.length === 0) {
    if (projectionChart) {
      projectionChart.destroy();
    }
    projectionChart = null;
    return;
  }

  const labels = trendData.map((item) => item.month);
  const balanceData = trendData.map((item) => item.balance);

  // Find the index where projections start (after "Current")
  const currentIndex = labels.indexOf("Current");
  const projectionStartIndex = currentIndex >= 0 ? currentIndex + 1 : 0;

  // Create datasets for historical and projected data
  const data = {
    labels: labels,
    datasets: [
      {
        label: "Balance Projection",
        data: balanceData,
        borderColor: colors.balance,
        backgroundColor: function (context) {
          const index = context.dataIndex;
          // Use a different color for projected data
          return index >= projectionStartIndex
            ? colors.background.projection
            : colors.background.balance;
        },
        borderColor: function (context) {
          const index = context.dataIndex;
          // Use a different color for projected data
          return index >= projectionStartIndex
            ? colors.projection
            : colors.balance;
        },
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: function (context) {
          const index = context.dataIndex;
          return index >= projectionStartIndex
            ? colors.projection
            : colors.balance;
        },
        fill: true,
        segment: {
          borderDash: function (context) {
            // Make the projection line dashed
            return context.p0DataIndex >= projectionStartIndex
              ? [6, 6]
              : undefined;
          },
        },
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
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
            return `Balance: ${formatCurrency(context.raw)}`;
          },
          title: function (tooltipItems) {
            const index = tooltipItems[0].dataIndex;
            let title = tooltipItems[0].label;

            // Add indicator for projections
            if (index >= projectionStartIndex) {
              title += " (Projected)";
            }

            return title;
          },
        },
      },
    },
  };

  // Create or update chart
  if (projectionChart) {
    projectionChart.data = data;
    projectionChart.options = options;
    projectionChart.update();
  } else {
    projectionChart = new Chart(ctx, {
      type: "line",
      data: data,
      options: options,
    });
  }
}
