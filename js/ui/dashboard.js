/**
 * Main Dashboard Logic - Connects all modules and handles UI interactions
 */

// Global instances
let currencyManager;
let transactionManager;
let exchangeRateScraper;

// Initialize dashboard when user is authenticated
async function initDashboard(user) {
  try {
    // Initialize managers
    currencyManager = new CurrencyManager(user.uid);
    await currencyManager.initialize();

    transactionManager = new TransactionManager(user.uid);
    await transactionManager.initialize();

    // Initialize scraper
    exchangeRateScraper = new ExchangeRateScraper();

    // Display user information
    document.getElementById("user-email").textContent = user.email || "User";

    // Setup UI components
    setupDashboardUI();

    // Load initial data
    await loadDashboardData();

    // Setup real-time updates
    setupRealTimeUpdates();

    console.log("Dashboard initialized successfully");
  } catch (error) {
    console.error("Error initializing dashboard:", error);
  }
}

/**
 * Set up UI components and event listeners
 */
function setupDashboardUI() {
  // Setup modals
  setupTransactionModal();
  setupAlertModal();
  setupReceiptProcessing();

  // Setup action buttons
  setupActionButtons();

  // Setup filters
  setupFilters();

  // Initialize charts
  if (typeof window.currencyCharts !== "undefined") {
    window.currencyCharts.initCurrencyCharts();
  }
}

/**
 * Set up transaction modal
 */
function setupTransactionModal() {
  const modal = document.getElementById("transaction-modal");
  const addBtn = document.getElementById("add-transaction-btn");
  const closeBtn = modal.querySelector(".close-modal");
  const cancelBtn = document.getElementById("cancel-transaction");
  const form = document.getElementById("transaction-form");
  const fetchRateBtn = document.getElementById("fetch-rate-btn");

  // Set today's date as default
  document.getElementById("transaction-date").valueAsDate = new Date();

  // Open modal when Add Transaction is clicked
  addBtn.addEventListener("click", function () {
    document.getElementById("modal-title").textContent = "Add Transaction";
    document.getElementById("transaction-id").value = "";
    form.reset();
    document.getElementById("transaction-date").valueAsDate = new Date();

    // Set default exchange rate to 1 for same currency transactions
    document.getElementById("exchange-rate").value = "1";

    modal.style.display = "block";
  });

  // Close modal methods
  closeBtn.addEventListener("click", function () {
    modal.style.display = "none";
  });

  cancelBtn.addEventListener("click", function () {
    modal.style.display = "none";
  });

  window.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // Handle currency selection changes
  const fromCurrency = document.getElementById("from-currency");
  const toCurrency = document.getElementById("to-currency");

  [fromCurrency, toCurrency].forEach((select) => {
    select.addEventListener("change", function () {
      updateExchangeRateVisibility();
    });
  });

  // Fetch current exchange rate
  fetchRateBtn.addEventListener("click", async function () {
    const from = fromCurrency.value;
    const to = toCurrency.value;

    if (from === to) {
      document.getElementById("exchange-rate").value = "1";
      return;
    }

    try {
      // Try to get current rate from currency manager
      let rate = 1;

      if (from === "NGN" && currencyManager.rates[to]) {
        // NGN to foreign currency
        rate = 1 / currencyManager.rates[to];
      } else if (to === "NGN" && currencyManager.rates[from]) {
        // Foreign currency to NGN
        rate = currencyManager.rates[from];
      } else if (from !== "NGN" && to !== "NGN") {
        // Cross currency (neither is NGN)
        rate = currencyManager.rates[from] / currencyManager.rates[to];
      }

      document.getElementById("exchange-rate").value = rate.toFixed(4);
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      alert("Could not fetch current exchange rate. Please enter manually.");
    }
  });

  // Update exchange rate visibility based on currency selection
  function updateExchangeRateVisibility() {
    const from = fromCurrency.value;
    const to = toCurrency.value;
    const rateGroup = document.getElementById("exchange-rate").parentElement;

    if (from === to) {
      // Same currency, hide exchange rate
      rateGroup.style.opacity = "0.5";
      document.getElementById("exchange-rate").value = "1";
      fetchRateBtn.disabled = true;
    } else {
      // Different currencies, show exchange rate
      rateGroup.style.opacity = "1";
      fetchRateBtn.disabled = false;
    }
  }

  // Handle form submission
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const transactionData = {
      date: document.getElementById("transaction-date").value,
      type: document.getElementById("transaction-type").value,
      description: document.getElementById("transaction-description").value,
      fromCurrency: document.getElementById("from-currency").value,
      toCurrency: document.getElementById("to-currency").value,
      amount: parseFloat(document.getElementById("transaction-amount").value),
      exchangeRate: parseFloat(
        document.getElementById("exchange-rate").value || 1
      ),
      fees: parseFloat(document.getElementById("transaction-fees").value || 0),
      category: document.getElementById("transaction-category").value,
    };

    const transactionId = document.getElementById("transaction-id").value;

    try {
      if (transactionId) {
        // Update existing transaction
        await transactionManager.updateTransaction(
          transactionId,
          transactionData
        );
      } else {
        // Add new transaction
        await transactionManager.addTransaction(transactionData);
      }

      // Close modal and refresh data
      modal.style.display = "none";
      await loadDashboardData();
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert("Error saving transaction. Please try again.");
    }
  });
}

/**
 * Set up alert modal
 */
function setupAlertModal() {
  const modal = document.getElementById("alert-modal");
  const addBtn = document.getElementById("add-alert-btn");
  const closeBtn = modal.querySelector(".close-modal");
  const cancelBtn = document.getElementById("cancel-alert");
  const form = document.getElementById("alert-form");

  // Open modal when Add Alert is clicked
  if (addBtn) {
    addBtn.addEventListener("click", function () {
      openAlertModal();
    });
  }

  // Close modal methods
  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      modal.style.display = "none";
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", function () {
      modal.style.display = "none";
    });
  }

  window.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // Update current rate when currency changes
  const currencySelect = document.getElementById("alert-currency");
  if (currencySelect) {
    currencySelect.addEventListener("change", updateAlertRateInfo);
  }

  // Handle form submission
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const currency = document.getElementById("alert-currency").value;
      const buyThreshold = parseFloat(
        document.getElementById("buy-threshold").value || 0
      );
      const sellThreshold = parseFloat(
        document.getElementById("sell-threshold").value || 0
      );

      try {
        await currencyManager.setAlertThresholds(
          currency,
          buyThreshold,
          sellThreshold
        );

        // Close modal and refresh alerts
        modal.style.display = "none";
        updateExchangeAlerts();
      } catch (error) {
        console.error("Error setting alert:", error);
        alert("Error setting alert. Please try again.");
      }
    });
  }

  // Open alert modal with current rates
  function openAlertModal() {
    const currency = document.getElementById("alert-currency").value;

    // Update rate information
    updateAlertRateInfo();

    // Show existing thresholds if any
    if (currencyManager.thresholds && currencyManager.thresholds[currency]) {
      document.getElementById("buy-threshold").value =
        currencyManager.thresholds[currency].buy > 0
          ? currencyManager.thresholds[currency].buy
          : "";

      document.getElementById("sell-threshold").value =
        currencyManager.thresholds[currency].sell > 0
          ? currencyManager.thresholds[currency].sell
          : "";
    } else {
      document.getElementById("buy-threshold").value = "";
      document.getElementById("sell-threshold").value = "";
    }

    modal.style.display = "block";
  }

  // Update rate information in the alert modal
  function updateAlertRateInfo() {
    const currency = document.getElementById("alert-currency").value;
    const currentRateElement = document.getElementById("current-alert-rate");
    const avgRateElement = document.getElementById("avg-alert-rate");

    if (currency && currencyManager.rates && currencyManager.rates[currency]) {
      currentRateElement.textContent = `${currencyManager.rates[
        currency
      ].toFixed(2)} NGN`;

      // Get average rate from trend analysis
      const trend = currencyManager.getTrendAnalysis(currency);
      if (trend && trend.avg) {
        avgRateElement.textContent = `${trend.avg.toFixed(2)} NGN`;
      } else {
        avgRateElement.textContent = "Not enough data";
      }
    } else {
      currentRateElement.textContent = "Not available";
      avgRateElement.textContent = "Not available";
    }
  }
}

/**
 * Set up receipt processing
 */
function setupReceiptProcessing() {
  // Assuming receipt-parser.js handles the setup
  if (
    typeof window.receiptParser !== "undefined" &&
    typeof window.receiptParser.init === "function"
  ) {
    window.receiptParser.init();
  }
}

/**
 * Set up action buttons
 */
function setupActionButtons() {
  // Refresh Rates button
  const refreshRatesBtn = document.getElementById("refresh-rates-btn");
  if (refreshRatesBtn) {
    refreshRatesBtn.addEventListener("click", async function () {
      try {
        refreshRatesBtn.disabled = true;
        refreshRatesBtn.textContent = "Refreshing...";

        // Fetch latest rates
        await currencyManager.fetchCurrentRates();

        // Update UI
        await loadDashboardData();

        refreshRatesBtn.textContent = "Refresh Rates";
        refreshRatesBtn.disabled = false;
      } catch (error) {
        console.error("Error refreshing rates:", error);
        refreshRatesBtn.textContent = "Refresh Failed";
        setTimeout(() => {
          refreshRatesBtn.textContent = "Refresh Rates";
          refreshRatesBtn.disabled = false;
        }, 3000);
      }
    });
  }
}

/**
 * Set up filters for transactions
 */
function setupFilters() {
  // Transaction filters
  const typeFilter = document.getElementById("type-filter");
  const currencyFilter = document.getElementById("currency-type-filter");
  const dateFilter = document.getElementById("date-filter");
  const searchFilter = document.getElementById("search-transactions");

  // Apply filters when changed
  if (typeFilter)
    typeFilter.addEventListener("change", applyTransactionFilters);
  if (currencyFilter)
    currencyFilter.addEventListener("change", applyTransactionFilters);
  if (dateFilter)
    dateFilter.addEventListener("change", applyTransactionFilters);

  // Debounce search to prevent too many updates
  if (searchFilter) {
    let searchTimeout;
    searchFilter.addEventListener("input", function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(applyTransactionFilters, 300);
    });
  }

  // Exchange rate filters
  const currencyRateFilter = document.getElementById("currency-filter");
  const timeRangeFilter = document.getElementById("time-range");
  const dataSourceFilter = document.getElementById("data-source");

  // Apply rate filters when changed
  if (currencyRateFilter)
    currencyRateFilter.addEventListener("change", applyCurrencyFilters);
  if (timeRangeFilter)
    timeRangeFilter.addEventListener("change", applyCurrencyFilters);
  if (dataSourceFilter)
    dataSourceFilter.addEventListener("change", applyCurrencyFilters);
}

/**
 * Apply transaction filters
 */
async function applyTransactionFilters() {
  try {
    const typeFilter = document.getElementById("type-filter")?.value || "all";
    const currencyFilter =
      document.getElementById("currency-type-filter")?.value || "all";
    const dateFilter = document.getElementById("date-filter")?.value || "all";
    const searchFilter =
      document.getElementById("search-transactions")?.value || "";

    const filters = {
      type: typeFilter,
      currency: currencyFilter,
      dateRange: dateFilter,
      search: searchFilter,
    };

    const transactions = await transactionManager.getFilteredTransactions(
      filters
    );
    renderTransactionsTable(transactions);
  } catch (error) {
    console.error("Error applying filters:", error);
  }
}

/**
 * Apply currency filters
 */
function applyCurrencyFilters() {
  try {
    const currencyFilter =
      document.getElementById("currency-filter")?.value || "all";
    const timeRange = parseInt(
      document.getElementById("time-range")?.value || "30"
    );
    const dataSource = document.getElementById("data-source")?.value || "all";

    // Update charts based on filters
    updateExchangeRateCharts(currencyFilter, timeRange, dataSource);

    // Update source comparison table
    updateRateSourcesTable(currencyFilter, dataSource);
  } catch (error) {
    console.error("Error applying currency filters:", error);
  }
}

/**
 * Load all dashboard data
 */
async function loadDashboardData() {
  try {
    // Update wallet display
    updateWalletDisplay();

    // Update exchange alerts
    updateExchangeAlerts();

    // Update overview stats
    updateOverviewStats();

    // Update currency cards
    updateCurrencyCards();

    // Update opportunity cards
    updateOpportunityCards();

    // Update overview chart
    updateOverviewChart();

    // Update transactions table with all transactions
    const transactions = await transactionManager.getAllTransactions();
    renderTransactionsTable(transactions);

    // Update exchange rate charts
    updateExchangeRateCharts();

    // Update currency analytics charts
    if (typeof window.currencyCharts !== "undefined") {
      window.currencyCharts.updateCurrencyCharts(
        currencyManager,
        transactionManager
      );
    }

    // Update prediction data
    updatePredictionData();

    // Update economic indicators
    updateEconomicIndicators();

    // Update market news
    updateMarketNews();
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
}

/**
 * Setup real-time updates
 */
function setupRealTimeUpdates() {
  // Schedule periodic exchange rate updates
  if (exchangeRateScraper) {
    exchangeRateScraper.scheduleUpdates((data) => {
      // When new data arrives from scraper
      if (data && data.rates) {
        // Update currency manager with new rates
        for (const [currency, rate] of Object.entries(data.rates)) {
          if (currencyManager.rates) {
            currencyManager.rates[currency] = rate;
          }
        }

        // Store the current rates
        currencyManager.storeCurrentRates();

        // Check for alerts
        currencyManager.checkAlerts();

        // Update UI elements that depend on current rates
        updateCurrencyCards();
        updateExchangeAlerts();
        updateOpportunityCards();
      }
    }, 30); // Update every 30 minutes
  }
}

/**
 * Update wallet balances display
 */
function updateWalletDisplay() {
  const walletSummary = document.getElementById("wallet-summary");
  if (!walletSummary) return;

  const wallets = transactionManager.wallets;

  if (!wallets || Object.keys(wallets).length === 0) {
    walletSummary.innerHTML = "<p>No wallet data available</p>";
    return;
  }

  let html = '<ul class="wallet-list">';

  for (const [currency, balance] of Object.entries(wallets)) {
    if (currency === "external") continue;

    let valueInNGN = balance;
    let equivalentText = "";

    // Calculate equivalent value in NGN for foreign currencies
    if (
      currency !== "NGN" &&
      currencyManager.rates &&
      currencyManager.rates[currency]
    ) {
      valueInNGN = balance * currencyManager.rates[currency];
      equivalentText = ` <span class="equivalent">≈ ₦${valueInNGN.toFixed(
        2
      )}</span>`;
    }

    html += `
      <li class="wallet-item">
        <span class="wallet-currency">${currency}</span>
        <span class="wallet-balance">${formatCurrencyWithSymbol(
          balance,
          currency
        )}${equivalentText}</span>
      </li>
    `;
  }

  html += "</ul>";
  walletSummary.innerHTML = html;
}

/**
 * Update exchange alerts display
 */
function updateExchangeAlerts() {
  const alertsContainer = document.getElementById("exchange-alerts");
  if (!alertsContainer) return;

  // Check for new alerts
  const alerts = currencyManager.checkAlerts();

  if (!alerts || alerts.length === 0) {
    alertsContainer.innerHTML = "<p>No active alerts</p>";
    return;
  }

  let html = '<ul class="alerts-list">';

  alerts.forEach((alert) => {
    const alertClass = alert.type === "buy" ? "alert-buy" : "alert-sell";

    html += `
      <li class="alert-item ${alertClass}">
        <span class="alert-icon">⚠️</span>
        <div class="alert-content">
          <div class="alert-title">${alert.type === "buy" ? "Buy" : "Sell"} ${
      alert.currency
    } Now</div>
          <div class="alert-message">${alert.message}</div>
        </div>
      </li>
    `;
  });

  html += "</ul>";
  alertsContainer.innerHTML = html;
}

/**
 * Update overview statistics
 */
function updateOverviewStats() {
  // Update financial statistics
  const stats = transactionManager.getFinancialStats();
  const analytics = transactionManager.getAnalyticsData();

  // Update total exchange volume
  const totalVolumeElement = document.getElementById("total-volume");
  if (totalVolumeElement) {
    const totalVolume = stats.totalSent + stats.totalReceived;
    totalVolumeElement.textContent = `₦${totalVolume.toFixed(2)}`;
  }

  // Update total profit/loss
  const totalProfitElement = document.getElementById("total-profit");
  if (totalProfitElement && analytics) {
    const profitLoss = analytics.profitLoss;
    const formattedProfit =
      profitLoss >= 0
        ? `+₦${profitLoss.toFixed(2)}`
        : `-₦${Math.abs(profitLoss).toFixed(2)}`;

    totalProfitElement.textContent = formattedProfit;
    totalProfitElement.className = profitLoss >= 0 ? "positive" : "negative";
  }

  // Update best performing currency
  const bestCurrencyElement = document.getElementById("best-currency");
  if (bestCurrencyElement && analytics && analytics.currencyPerformance) {
    const currencies = Object.keys(analytics.currencyPerformance);

    if (currencies.length > 0) {
      // Find currency with highest positive change
      let bestCurrency = currencies[0];
      let highestChange = analytics.currencyPerformance[bestCurrency].change;

      currencies.forEach((currency) => {
        if (analytics.currencyPerformance[currency].change > highestChange) {
          bestCurrency = currency;
          highestChange = analytics.currencyPerformance[currency].change;
        }
      });

      if (highestChange > 0) {
        bestCurrencyElement.textContent = `${bestCurrency} (+${highestChange.toFixed(
          2
        )}%)`;
        bestCurrencyElement.className = "positive";
      } else {
        bestCurrencyElement.textContent = "None (All Negative)";
      }
    } else {
      bestCurrencyElement.textContent = "Not enough data";
    }
  }

  // Update recent activity
  const recentActivityElement = document.getElementById("recent-activity");
  if (recentActivityElement) {
    recentActivityElement.textContent = stats.recentActivity;
  }
}

/**
 * Update currency cards on overview page
 */
function updateCurrencyCards() {
  const container = document.getElementById("currency-cards");
  if (!container) return;

  const currencies = currencyManager.currencies;

  if (!currencies || currencies.length === 0 || !currencyManager.rates) {
    container.innerHTML = "<p>No currency data available</p>";
    return;
  }

  let html = "";

  currencies.forEach((currency) => {
    if (currency === "NGN") return; // Skip Naira

    const rate = currencyManager.rates[currency];
    if (!rate) return;

    // Get trend data
    const trend = currencyManager.getTrendAnalysis(currency);
    let trendClass = "neutral";
    let trendIcon = "➡️";
    let changeText = "No change";

    if (trend) {
      if (trend.changePercent > 1) {
        trendClass = "positive";
        trendIcon = "⬆️";
        changeText = `+${trend.changePercent.toFixed(2)}%`;
      } else if (trend.changePercent < -1) {
        trendClass = "negative";
        trendIcon = "⬇️";
        changeText = `${trend.changePercent.toFixed(2)}%`;
      } else {
        changeText = `${trend.changePercent.toFixed(2)}%`;
      }
    }

    html += `
      <div class="currency-card">
        <div class="currency-header">
          <span class="currency-name">${currency}/NGN</span>
          <span class="trend-indicator ${trendClass}">${trendIcon}</span>
        </div>
        <div class="currency-rate">₦${rate.toFixed(2)}</div>
        <div class="currency-change ${trendClass}">${changeText}</div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * Update opportunity cards on overview page
 */
function updateOpportunityCards() {
  const container = document.getElementById("opportunity-cards");
  if (!container) return;

  const currencies = currencyManager.currencies.filter((c) => c !== "NGN");

  if (!currencies || currencies.length === 0) {
    container.innerHTML = "<p>No opportunity data available</p>";
    return;
  }

  // Calculate opportunity scores
  const opportunities = [];

  currencies.forEach((currency) => {
    const trend = currencyManager.getTrendAnalysis(currency);
    if (!trend) return;

    // Simple scoring:
    // Buy score high when price is lower than average and falling
    // Sell score high when price is higher than average and rising

    const buyScore =
      trend.currentRate < trend.avg
        ? ((trend.avg - trend.currentRate) / trend.avg) * 100
        : 0;

    const sellScore =
      trend.currentRate > trend.avg
        ? ((trend.currentRate - trend.avg) / trend.avg) * 100
        : 0;

    const holdScore = trend.volatility < 0.02 ? 70 : 30;

    // Determine the best action
    let bestAction = "hold";
    let bestScore = holdScore;

    if (buyScore > bestScore) {
      bestAction = "buy";
      bestScore = buyScore;
    }

    if (sellScore > bestScore) {
      bestAction = "sell";
      bestScore = sellScore;
    }

    opportunities.push({
      currency,
      action: bestAction,
      score: bestScore,
      currentRate: trend.currentRate,
      avgRate: trend.avg,
      changePercent: trend.changePercent,
    });
  });

  // Sort by score (highest first)
  opportunities.sort((a, b) => b.score - a.score);

  // Take top 3
  const topOpportunities = opportunities.slice(0, 3);

  if (topOpportunities.length === 0) {
    container.innerHTML = "<p>Not enough data for opportunity analysis</p>";
    return;
  }

  let html = "";

  topOpportunities.forEach((opportunity) => {
    const actionClass =
      opportunity.action === "buy"
        ? "action-buy"
        : opportunity.action === "sell"
        ? "action-sell"
        : "action-hold";

    const actionIcon =
      opportunity.action === "buy"
        ? "🔽"
        : opportunity.action === "sell"
        ? "🔼"
        : "⏸️";

    const actionText = opportunity.action.toUpperCase();

    const rateComparison =
      opportunity.currentRate < opportunity.avgRate
        ? `${(
            ((opportunity.avgRate - opportunity.currentRate) /
              opportunity.avgRate) *
            100
          ).toFixed(1)}% below average`
        : `${(
            ((opportunity.currentRate - opportunity.avgRate) /
              opportunity.avgRate) *
            100
          ).toFixed(1)}% above average`;

    html += `
      <div class="opportunity-card ${actionClass}">
        <div class="opportunity-header">
          <span class="opportunity-currency">${opportunity.currency}</span>
          <span class="opportunity-action">${actionIcon} ${actionText}</span>
        </div>
        <div class="opportunity-rate">Current: ₦${opportunity.currentRate.toFixed(
          2
        )}</div>
        <div class="opportunity-avg">Average: ₦${opportunity.avgRate.toFixed(
          2
        )}</div>
        <div class="opportunity-comparison">${rateComparison}</div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * Update overview chart
 */
function updateOverviewChart() {
  const canvas = document.getElementById("overview-rate-chart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const currencies = currencyManager.currencies.filter((c) => c !== "NGN");
  const historicalRates = currencyManager.historicalRates;

  if (!currencies || currencies.length === 0 || !historicalRates) {
    // No data available
    return;
  }

  // Prepare datasets
  const datasets = [];

  currencies.forEach((currency) => {
    if (!historicalRates[currency] || historicalRates[currency].length === 0) {
      return;
    }

    // Sort by date
    const sortedRates = [...historicalRates[currency]].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Only take last 30 days for overview
    const recentRates = sortedRates.slice(-30);

    if (recentRates.length === 0) return;

    datasets.push({
      label: `${currency}/NGN`,
      data: recentRates.map((item) => ({
        x: new Date(item.date),
        y: item.rate,
      })),
      borderColor: window.currencyColors
        ? window.currencyColors[currency]
        : getRandomColor(),
      backgroundColor: "transparent",
      borderWidth: 2,
      tension: 0.3,
      pointRadius: 0,
      pointHoverRadius: 5,
    });
  });

  if (datasets.length === 0) {
    return;
  }

  // Create chart
  if (window.overviewChart) {
    window.overviewChart.destroy();
  }

  window.overviewChart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "time",
          time: {
            unit: "day",
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
        },
      },
      plugins: {
        legend: {
          position: "top",
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
    },
  });
}

/**
 * Render transactions table
 */
function renderTransactionsTable(transactions) {
  const tableBody = document.getElementById("transactions-body");
  if (!tableBody) return;

  if (!transactions || transactions.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="9" class="text-center">No transactions found</td></tr>';
    return;
  }

  tableBody.innerHTML = "";

  // Sort by date (newest first for display)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  sortedTransactions.forEach((transaction) => {
    const row = document.createElement("tr");

    // Calculate equivalent amount in destination currency
    let equivalentAmount = transaction.amount;
    if (transaction.fromCurrency !== transaction.toCurrency) {
      equivalentAmount = transaction.amount * transaction.exchangeRate;
      if (transaction.fees) {
        equivalentAmount -= transaction.fees;
      }
    }

    row.innerHTML = `
      <td>${formatDate(transaction.date)}</td>
      <td>${transaction.description}</td>
      <td class="${transaction.type}">${transaction.type}</td>
      <td>${transaction.fromCurrency}</td>
      <td>${transaction.toCurrency}</td>
      <td>${transaction.exchangeRate.toFixed(4)}</td>
      <td>${formatCurrencyWithSymbol(
        transaction.amount,
        transaction.fromCurrency
      )}</td>
      <td>${formatCurrencyWithSymbol(
        equivalentAmount,
        transaction.toCurrency
      )}</td>
      <td>
        <button class="btn-edit" data-id="${transaction.id}">Edit</button>
        <button class="btn-delete" data-id="${transaction.id}">Delete</button>
      </td>
    `;

    tableBody.appendChild(row);
  });

  // Add event listeners to edit/delete buttons
  document.querySelectorAll(".btn-edit").forEach((button) => {
    button.addEventListener("click", function () {
      editTransaction(this.getAttribute("data-id"));
    });
  });

  document.querySelectorAll(".btn-delete").forEach((button) => {
    button.addEventListener("click", function () {
      deleteTransaction(this.getAttribute("data-id"));
    });
  });
}

/**
 * Edit transaction
 */
async function editTransaction(id) {
  const modal = document.getElementById("transaction-modal");

  try {
    // Find transaction in existing data
    const transaction = transactionManager.transactions.find(
      (t) => t.id === id
    );

    if (!transaction) {
      console.error("Transaction not found");
      return;
    }

    // Populate form
    document.getElementById("modal-title").textContent = "Edit Transaction";
    document.getElementById("transaction-id").value = id;
    document.getElementById("transaction-date").value = transaction.date;
    document.getElementById("transaction-type").value = transaction.type;
    document.getElementById("transaction-description").value =
      transaction.description;
    document.getElementById("from-currency").value = transaction.fromCurrency;
    document.getElementById("to-currency").value = transaction.toCurrency;
    document.getElementById("transaction-amount").value = transaction.amount;
    document.getElementById("exchange-rate").value = transaction.exchangeRate;
    document.getElementById("transaction-fees").value = transaction.fees || 0;
    document.getElementById("transaction-category").value =
      transaction.category || "exchange";

    // Show modal
    modal.style.display = "block";
  } catch (error) {
    console.error("Error editing transaction:", error);
  }
}

/**
 * Delete transaction
 */
async function deleteTransaction(id) {
  if (confirm("Are you sure you want to delete this transaction?")) {
    try {
      await transactionManager.deleteTransaction(id);
      await loadDashboardData();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Error deleting transaction. Please try again.");
    }
  }
}

/**
 * Update exchange rate charts
 */
function updateExchangeRateCharts(
  currencyFilter = "all",
  timeRange = 30,
  dataSource = "all"
) {
  // This will be handled by currency-charts.js
  if (typeof window.currencyCharts !== "undefined") {
    window.currencyCharts.updateRateHistoryChart(currencyManager);
    window.currencyCharts.updateRateTrendChart(currencyManager);
  }
}

/**
 * Update rate sources table
 */
function updateRateSourcesTable(currencyFilter = "all", dataSource = "all") {
  const container = document.getElementById("rate-sources-table");
  if (!container) return;

  const currencies =
    currencyFilter === "all"
      ? currencyManager.currencies.filter((c) => c !== "NGN")
      : [currencyFilter];

  if (!currencies || currencies.length === 0 || !exchangeRateScraper) {
    container.innerHTML = "<p>No source data available</p>";
    return;
  }

  // Get source data
  exchangeRateScraper
    .fetchAllSources()
    .then((consolidatedData) => {
      if (
        !consolidatedData ||
        !consolidatedData.sourceData ||
        consolidatedData.sourceData.length === 0
      ) {
        container.innerHTML = "<p>No source data available</p>";
        return;
      }

      // Filter sources if needed
      let sources = consolidatedData.sourceData;
      if (dataSource === "official") {
        sources = sources.filter(
          (s) => s.source.includes("Central Bank") || s.source.includes("FMDQ")
        );
      } else if (dataSource === "market") {
        sources = sources.filter(
          (s) =>
            !s.source.includes("Central Bank") && !s.source.includes("FMDQ")
        );
      }

      // Build table
      let html = `
      <table class="rates-table">
        <thead>
          <tr>
            <th>Source</th>
            ${currencies.map((currency) => `<th>${currency}/NGN</th>`).join("")}
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
    `;

      sources.forEach((source) => {
        html += `
        <tr>
          <td>${source.source}</td>
          ${currencies
            .map((currency) => {
              const rate =
                source.rates && source.rates[currency]
                  ? `₦${source.rates[currency].toFixed(2)}`
                  : "N/A";
              return `<td>${rate}</td>`;
            })
            .join("")}
          <td>${formatDate(source.timestamp)}</td>
        </tr>
      `;
      });

      // Add consolidated rates row
      html += `
      <tr class="consolidated-row">
        <td><strong>Consolidated</strong></td>
        ${currencies
          .map((currency) => {
            const rate =
              consolidatedData.rates && consolidatedData.rates[currency]
                ? `₦${consolidatedData.rates[currency].toFixed(2)}`
                : "N/A";
            const reliability =
              consolidatedData.reliability &&
              consolidatedData.reliability[currency]
                ? ` (${(consolidatedData.reliability[currency] * 100).toFixed(
                    0
                  )}% reliable)`
                : "";
            return `<td><strong>${rate}</strong>${reliability}</td>`;
          })
          .join("")}
        <td><strong>${formatDate(consolidatedData.timestamp)}</strong></td>
      </tr>
    `;

      html += `
        </tbody>
      </table>
    `;

      container.innerHTML = html;
    })
    .catch((error) => {
      console.error("Error fetching source data:", error);
      container.innerHTML = "<p>Error loading source data</p>";
    });
}

/**
 * Update prediction data
 */
function updatePredictionData() {
  // Update currency predictions
  updateCurrencyPredictions();

  // Update optimal trading times
  updateOptimalTradingTimes();

  // Update alerts table
  updateAlertsTable();

  // Update forecast chart
  updateForecastChart();
}

/**
 * Update currency predictions
 */
function updateCurrencyPredictions() {
  const container = document.getElementById("currency-predictions");
  if (!container) return;

  const currencies = currencyManager.currencies.filter((c) => c !== "NGN");

  if (!currencies || currencies.length === 0) {
    container.innerHTML = "<p>No prediction data available</p>";
    return;
  }

  let html = '<div class="prediction-list">';

  currencies.forEach((currency) => {
    // Get prediction for 7, 14, and 30 days
    const prediction7 = currencyManager.predictFutureRate(currency, 7);
    const prediction14 = currencyManager.predictFutureRate(currency, 14);
    const prediction30 = currencyManager.predictFutureRate(currency, 30);

    if (!prediction7 || !prediction14 || !prediction30) return;

    const currentRate = currencyManager.rates[currency];
    if (!currentRate) return;

    // Calculate change percentages
    const change7 = ((prediction7.rate - currentRate) / currentRate) * 100;
    const change14 = ((prediction14.rate - currentRate) / currentRate) * 100;
    const change30 = ((prediction30.rate - currentRate) / currentRate) * 100;

    // Determine trend classes
    const trend7Class =
      change7 > 1 ? "positive" : change7 < -1 ? "negative" : "neutral";
    const trend14Class =
      change14 > 1 ? "positive" : change14 < -1 ? "negative" : "neutral";
    const trend30Class =
      change30 > 1 ? "positive" : change30 < -1 ? "negative" : "neutral";

    // Format change signs
    const changeSign7 = change7 > 0 ? "+" : "";
    const changeSign14 = change14 > 0 ? "+" : "";
    const changeSign30 = change30 > 0 ? "+" : "";

    html += `
      <div class="prediction-item">
        <div class="prediction-currency">${currency}/NGN</div>
        <div class="prediction-current">Current: ₦${currentRate.toFixed(
          2
        )}</div>
        <div class="prediction-values">
          <div class="prediction-period">
            <span class="period-label">7 Days:</span>
            <span class="period-value">₦${prediction7.rate.toFixed(2)}</span>
            <span class="period-change ${trend7Class}">${changeSign7}${change7.toFixed(
      2
    )}%</span>
          </div>
          <div class="prediction-period">
            <span class="period-label">14 Days:</span>
            <span class="period-value">₦${prediction14.rate.toFixed(2)}</span>
            <span class="period-change ${trend14Class}">${changeSign14}${change14.toFixed(
      2
    )}%</span>
          </div>
          <div class="prediction-period">
            <span class="period-label">30 Days:</span>
            <span class="period-value">₦${prediction30.rate.toFixed(2)}</span>
            <span class="period-change ${trend30Class}">${changeSign30}${change30.toFixed(
      2
    )}%</span>
          </div>
        </div>
        <div class="prediction-confidence">Confidence: ${(
          prediction30.confidence * 100
        ).toFixed(0)}%</div>
      </div>
    `;
  });

  html += "</div>";
  container.innerHTML = html;
}

/**
 * Update optimal trading times
 */
function updateOptimalTradingTimes() {
  const container = document.getElementById("optimal-days");
  if (!container) return;

  const currencies = currencyManager.currencies.filter((c) => c !== "NGN");

  if (!currencies || currencies.length === 0) {
    container.innerHTML = "<p>No trading time data available</p>";
    return;
  }

  let html = '<div class="trading-times-list">';

  currencies.forEach((currency) => {
    const optimalTimes = currencyManager.getOptimalTradingTimes(currency);

    if (!optimalTimes || !optimalTimes.buyDay || !optimalTimes.sellDay) {
      return;
    }

    html += `
      <div class="trading-time-item">
        <div class="trading-currency">${currency}/NGN</div>
        <div class="trading-days">
          <div class="trading-best-buy">
            <span class="trading-label">Best day to buy ${currency}:</span>
            <span class="trading-value">${optimalTimes.buyDay.name}</span>
            <span class="trading-rate">Avg: ₦${optimalTimes.buyDay.avgRate.toFixed(
              2
            )}</span>
          </div>
          <div class="trading-best-sell">
            <span class="trading-label">Best day to sell ${currency}:</span>
            <span class="trading-value">${optimalTimes.sellDay.name}</span>
            <span class="trading-rate">Avg: ₦${optimalTimes.sellDay.avgRate.toFixed(
              2
            )}</span>
          </div>
        </div>
      </div>
    `;
  });

  html += "</div>";
  container.innerHTML = html;
}

/**
 * Update alerts table
 */
function updateAlertsTable() {
  const container = document.getElementById("alerts-table");
  if (!container) return;

  const currencies = currencyManager.currencies.filter((c) => c !== "NGN");

  if (!currencies || currencies.length === 0) {
    container.innerHTML = "<p>No alert data available</p>";
    return;
  }

  let html = `
    <table class="alerts-table">
      <thead>
        <tr>
          <th>Currency</th>
          <th>Current Rate</th>
          <th>Buy Alert</th>
          <th>Sell Alert</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  currencies.forEach((currency) => {
    const currentRate = currencyManager.rates[currency];
    const thresholds = currencyManager.thresholds[currency] || {
      buy: 0,
      sell: 0,
    };

    if (!currentRate) return;

    html += `
      <tr>
        <td>${currency}/NGN</td>
        <td>₦${currentRate.toFixed(2)}</td>
        <td>
          ${
            thresholds.buy > 0
              ? `₦${thresholds.buy.toFixed(2)} 
             ${
               currentRate <= thresholds.buy
                 ? '<span class="alert-active">ACTIVE</span>'
                 : ""
             }`
              : "Not set"
          }
        </td>
        <td>
          ${
            thresholds.sell > 0
              ? `₦${thresholds.sell.toFixed(2)} 
             ${
               currentRate >= thresholds.sell
                 ? '<span class="alert-active">ACTIVE</span>'
                 : ""
             }`
              : "Not set"
          }
        </td>
        <td>
          <button class="btn-edit-alert" data-currency="${currency}">Edit</button>
          <button class="btn-delete-alert" data-currency="${currency}">Delete</button>
        </td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;

  // Add event listeners to edit/delete buttons
  document.querySelectorAll(".btn-edit-alert").forEach((button) => {
    button.addEventListener("click", function () {
      const currency = this.getAttribute("data-currency");
      editAlert(currency);
    });
  });

  document.querySelectorAll(".btn-delete-alert").forEach((button) => {
    button.addEventListener("click", function () {
      const currency = this.getAttribute("data-currency");
      deleteAlert(currency);
    });
  });
}

/**
 * Edit alert
 */
function editAlert(currency) {
  const modal = document.getElementById("alert-modal");
  if (!modal) return;

  // Set selected currency
  const currencySelect = document.getElementById("alert-currency");
  if (currencySelect) {
    currencySelect.value = currency;
  }

  // Update rate information
  updateAlertRateInfo();

  // Show existing thresholds
  if (currencyManager.thresholds && currencyManager.thresholds[currency]) {
    document.getElementById("buy-threshold").value =
      currencyManager.thresholds[currency].buy > 0
        ? currencyManager.thresholds[currency].buy
        : "";

    document.getElementById("sell-threshold").value =
      currencyManager.thresholds[currency].sell > 0
        ? currencyManager.thresholds[currency].sell
        : "";
  } else {
    document.getElementById("buy-threshold").value = "";
    document.getElementById("sell-threshold").value = "";
  }

  // Show modal
  modal.style.display = "block";
}

/**
 * Delete alert
 */
async function deleteAlert(currency) {
  if (confirm(`Are you sure you want to delete the alert for ${currency}?`)) {
    try {
      await currencyManager.setAlertThresholds(currency, 0, 0);
      updateAlertsTable();
      updateExchangeAlerts();
    } catch (error) {
      console.error("Error deleting alert:", error);
      alert("Error deleting alert. Please try again.");
    }
  }
}

/**
 * Update forecast chart
 */
function updateForecastChart() {
  const canvas = document.getElementById("forecast-chart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const currencies = currencyManager.currencies.filter((c) => c !== "NGN");

  if (!currencies || currencies.length === 0) {
    // No data available
    return;
  }

  // Prepare datasets
  const datasets = [];

  currencies.forEach((currency) => {
    const currentRate = currencyManager.rates[currency];
    if (!currentRate) return;

    const prediction7 = currencyManager.predictFutureRate(currency, 7);
    const prediction14 = currencyManager.predictFutureRate(currency, 14);
    const prediction30 = currencyManager.predictFutureRate(currency, 30);

    if (!prediction7 || !prediction14 || !prediction30) return;

    const now = new Date();
    const day7 = new Date(now);
    day7.setDate(now.getDate() + 7);
    const day14 = new Date(now);
    day14.setDate(now.getDate() + 14);
    const day30 = new Date(now);
    day30.setDate(now.getDate() + 30);

    datasets.push({
      label: `${currency}/NGN`,
      data: [
        { x: now, y: currentRate },
        { x: day7, y: prediction7.rate },
        { x: day14, y: prediction14.rate },
        { x: day30, y: prediction30.rate },
      ],
      borderColor: window.currencyColors
        ? window.currencyColors[currency]
        : getRandomColor(),
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderWidth: 2,
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderDash: [5, 5], // Dashed line for forecasts
      fill: false,
    });
  });

  if (datasets.length === 0) {
    return;
  }

  // Create chart
  if (window.forecastChart) {
    window.forecastChart.destroy();
  }

  window.forecastChart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "time",
          time: {
            unit: "day",
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
        },
      },
      plugins: {
        legend: {
          position: "top",
        },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            title: function (context) {
              const date = new Date(context[0].parsed.x);
              return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
            },
            label: function (context) {
              const label = context.dataset.label || "";
              const value = context.parsed.y;

              // Calculate days from now
              const now = new Date();
              const pointDate = new Date(context.parsed.x);
              const daysDiff = Math.round(
                (pointDate - now) / (1000 * 60 * 60 * 24)
              );

              let suffix = "";
              if (daysDiff > 0) {
                suffix = ` (Forecast: +${daysDiff} days)`;
              }

              return `${label}: ₦${value.toFixed(2)}${suffix}`;
            },
          },
        },
      },
    },
  });
}

/**
 * Update economic indicators display
 */
function updateEconomicIndicators() {
  const container = document.getElementById("economic-indicators");
  if (!container) return;

  // We will fetch economic indicators using the scraper
  exchangeRateScraper
    .getEconomicIndicators()
    .then((data) => {
      if (
        !data ||
        !data.indicators ||
        Object.keys(data.indicators).length === 0
      ) {
        container.innerHTML = "<p>No economic data available</p>";
        return;
      }

      let html = "";

      for (const [key, indicator] of Object.entries(data.indicators)) {
        // Format indicator name
        const name = key.replace(/([A-Z])/g, " $1").trim();
        const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

        // Format change direction
        const changeClass =
          indicator.change > 0
            ? "positive"
            : indicator.change < 0
            ? "negative"
            : "neutral";
        const changeSign = indicator.change > 0 ? "+" : "";

        // Format unit
        const unit = indicator.unit ? ` ${indicator.unit}` : "%";

        html += `
        <div class="indicator-card">
          <div class="indicator-header">
            <span class="indicator-name">${formattedName}</span>
            <span class="indicator-impact impact-${
              indicator.impact || "medium"
            }">${indicator.impact || "medium"} impact</span>
          </div>
          <div class="indicator-value">${indicator.value}${unit}</div>
          <div class="indicator-change ${changeClass}">${changeSign}${
          indicator.change
        }${unit}</div>
          <div class="indicator-date">${formatDate(indicator.date)}</div>
        </div>
      `;
      }

      container.innerHTML = html;
    })
    .catch((error) => {
      console.error("Error fetching economic indicators:", error);
      container.innerHTML = "<p>Error loading economic data</p>";
    });
}

/**
 * Update market news display
 */
function updateMarketNews() {
  const container = document.getElementById("market-news");
  if (!container) return;

  // We will fetch news using the scraper
  exchangeRateScraper
    .getRelevantNews()
    .then((news) => {
      if (!news || news.length === 0) {
        container.innerHTML = "<p>No market news available</p>";
        return;
      }

      let html = "";

      news.forEach((item) => {
        // Format sentiment
        const sentimentClass =
          item.sentiment === "positive"
            ? "positive"
            : item.sentiment === "negative"
            ? "negative"
            : "neutral";

        const sentimentIcon =
          item.sentiment === "positive"
            ? "📈"
            : item.sentiment === "negative"
            ? "📉"
            : "📊";

        html += `
        <div class="news-item">
          <div class="news-header">
            <span class="news-sentiment ${sentimentClass}">${sentimentIcon}</span>
            <span class="news-title">${item.title}</span>
          </div>
          <div class="news-summary">${item.summary}</div>
          <div class="news-meta">
            <span class="news-source">${item.source}</span>
            <span class="news-date">${formatDate(item.date)}</span>
            <span class="news-relevance">Relevance: ${(
              item.relevance * 100
            ).toFixed(0)}%</span>
          </div>
        </div>
      `;
      });

      container.innerHTML = html;
    })
    .catch((error) => {
      console.error("Error fetching market news:", error);
      container.innerHTML = "<p>Error loading market news</p>";
    });
}

/**
 * Format date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format currency with symbol
 */
function formatCurrencyWithSymbol(amount, currency) {
  let symbol = "₦";

  switch (currency) {
    case "USD":
      symbol = "$";
      break;
    case "GBP":
      symbol = "£";
      break;
    case "EUR":
      symbol = "€";
      break;
  }

  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Generate random color
 */
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Export functions
window.dashboard = {
  initDashboard,
  loadDashboardData,
  updateCurrencyCards,
  updateExchangeAlerts,
  updateRateSourcesTable,
};
