/**
 * TransactionManager - Handles financial transactions with enhanced currency tracking
 */
class TransactionManager {
  constructor(userId) {
    this.userId = userId;
    this.db = firebase.firestore();
    this.transactions = [];
    this.wallets = {}; // Store balances for different currencies
  }

  /**
   * Initialize transaction manager and load data
   */
  async initialize() {
    await this.loadWallets();
    await this.getAllTransactions();
    return this;
  }

  /**
   * Load user wallet balances
   */
  async loadWallets() {
    try {
      const doc = await this.db
        .collection("userWallets")
        .doc(this.userId)
        .get();

      if (doc.exists) {
        this.wallets = doc.data();
      } else {
        // Initialize default wallets if none exist
        this.wallets = {
          NGN: 0,
          USD: 0,
          GBP: 0,
          EUR: 0,
        };

        await this.db
          .collection("userWallets")
          .doc(this.userId)
          .set(this.wallets);
      }

      return this.wallets;
    } catch (error) {
      console.error("Error loading wallets:", error);
    }
  }

  /**
   * Update wallet balances
   */
  async updateWallets() {
    try {
      await this.db
        .collection("userWallets")
        .doc(this.userId)
        .set(this.wallets);
      return true;
    } catch (error) {
      console.error("Error updating wallets:", error);
      return false;
    }
  }

  /**
   * Get all transactions for the user
   */
  async getAllTransactions() {
    try {
      const snapshot = await this.db
        .collection("transactions")
        .where("userId", "==", this.userId)
        .orderBy("timestamp", "desc")
        .get();

      this.transactions = [];

      snapshot.forEach((doc) => {
        const transaction = {
          id: doc.id,
          ...doc.data(),
        };

        // Convert timestamp to Date object if needed
        if (transaction.timestamp && transaction.timestamp.toDate) {
          transaction.date = transaction.timestamp
            .toDate()
            .toISOString()
            .split("T")[0];
          transaction.timestamp = transaction.timestamp.toDate();
        }

        this.transactions.push(transaction);
      });

      // Sort by date (newest first)
      this.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

      return this.transactions;
    } catch (error) {
      console.error("Error getting transactions:", error);
    }
  }

  /**
   * Add a new transaction
   * @param {Object} transactionData - Transaction data
   */
  async addTransaction(transactionData) {
    try {
      // Set defaults
      const transaction = {
        userId: this.userId,
        date: transactionData.date || new Date().toISOString().split("T")[0],
        timestamp: firebase.firestore.Timestamp.fromDate(
          new Date(transactionData.date || new Date())
        ),
        type: transactionData.type || "sent", // "sent" or "received"
        description: transactionData.description || "",
        amount: parseFloat(transactionData.amount) || 0,
        fromCurrency: transactionData.fromCurrency || "NGN",
        toCurrency: transactionData.toCurrency || "NGN",
        exchangeRate: transactionData.exchangeRate || 1,
        fees: parseFloat(transactionData.fees) || 0,
        category: transactionData.category || "general",
        tags: transactionData.tags || [],
      };

      // Update wallet balances
      this.updateWalletBalances(transaction);

      // Add transaction to Firestore
      const docRef = await this.db.collection("transactions").add(transaction);

      // Add to local array
      transaction.id = docRef.id;
      this.transactions.unshift(transaction);

      // Update wallet balances in Firestore
      await this.updateWallets();

      return transaction;
    } catch (error) {
      console.error("Error adding transaction:", error);
      throw error;
    }
  }

  /**
   * Update an existing transaction
   * @param {String} id - Transaction ID
   * @param {Object} transactionData - Updated transaction data
   */
  async updateTransaction(id, transactionData) {
    try {
      // Find the transaction
      const index = this.transactions.findIndex((t) => t.id === id);

      if (index === -1) {
        throw new Error("Transaction not found");
      }

      // Get the old transaction for reverting wallet balances
      const oldTransaction = { ...this.transactions[index] };

      // Prepare updated transaction
      const updatedTransaction = {
        ...oldTransaction,
        ...transactionData,
        userId: this.userId,
      };

      // Update timestamp if date changed
      if (transactionData.date) {
        updatedTransaction.timestamp = firebase.firestore.Timestamp.fromDate(
          new Date(transactionData.date)
        );
      }

      // Revert old transaction's effect on wallets
      this.revertWalletBalances(oldTransaction);

      // Apply new transaction's effect on wallets
      this.updateWalletBalances(updatedTransaction);

      // Update in Firestore
      await this.db
        .collection("transactions")
        .doc(id)
        .update(updatedTransaction);

      // Update local array
      this.transactions[index] = updatedTransaction;

      // Update wallet balances in Firestore
      await this.updateWallets();

      return updatedTransaction;
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  }

  /**
   * Delete a transaction
   * @param {String} id - Transaction ID
   */
  async deleteTransaction(id) {
    try {
      // Find the transaction
      const index = this.transactions.findIndex((t) => t.id === id);

      if (index === -1) {
        throw new Error("Transaction not found");
      }

      // Get the transaction for reverting wallet balances
      const transaction = this.transactions[index];

      // Revert transaction's effect on wallets
      this.revertWalletBalances(transaction);

      // Delete from Firestore
      await this.db.collection("transactions").doc(id).delete();

      // Remove from local array
      this.transactions.splice(index, 1);

      // Update wallet balances in Firestore
      await this.updateWallets();

      return true;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }
  }

  /**
   * Get filtered transactions
   * @param {Object} filters - Filter criteria
   */
  async getFilteredTransactions(filters) {
    try {
      let filtered = [...this.transactions];

      // Filter by type
      if (filters.type && filters.type !== "all") {
        filtered = filtered.filter((t) => t.type === filters.type);
      }

      // Filter by currency
      if (filters.currency && filters.currency !== "all") {
        filtered = filtered.filter(
          (t) =>
            t.fromCurrency === filters.currency ||
            t.toCurrency === filters.currency
        );
      }

      // Filter by date range
      if (filters.dateRange) {
        const now = new Date();
        let startDate;

        switch (filters.dateRange) {
          case "week":
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            break;
          case "month":
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
            break;
          case "quarter":
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 3);
            break;
          case "year":
            startDate = new Date(now);
            startDate.setFullYear(now.getFullYear() - 1);
            break;
          default:
            startDate = null;
        }

        if (startDate) {
          filtered = filtered.filter(
            (t) => new Date(t.date) >= startDate && new Date(t.date) <= now
          );
        }
      }

      // Filter by search term
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.description.toLowerCase().includes(searchTerm) ||
            t.category.toLowerCase().includes(searchTerm) ||
            (t.tags &&
              t.tags.some((tag) => tag.toLowerCase().includes(searchTerm)))
        );
      }

      return filtered;
    } catch (error) {
      console.error("Error filtering transactions:", error);
      return this.transactions;
    }
  }

  /**
   * Update wallet balances based on a transaction
   * @param {Object} transaction - Transaction data
   */
  updateWalletBalances(transaction) {
    // Ensure wallets exist
    if (!this.wallets[transaction.fromCurrency]) {
      this.wallets[transaction.fromCurrency] = 0;
    }

    if (!this.wallets[transaction.toCurrency]) {
      this.wallets[transaction.toCurrency] = 0;
    }

    if (transaction.type === "sent") {
      // For sent money, subtract from fromCurrency wallet
      this.wallets[transaction.fromCurrency] -= transaction.amount;

      // If currency exchange, add to toCurrency wallet
      if (transaction.fromCurrency !== transaction.toCurrency) {
        const convertedAmount =
          transaction.amount * transaction.exchangeRate - transaction.fees;
        this.wallets[transaction.toCurrency] += convertedAmount;
      }
    } else if (transaction.type === "received") {
      // For received money, add to toCurrency wallet
      this.wallets[transaction.toCurrency] += transaction.amount;

      // If currency exchange, subtract from fromCurrency wallet
      if (
        transaction.fromCurrency !== transaction.toCurrency &&
        transaction.fromCurrency !== "external"
      ) {
        const originalAmount =
          transaction.amount / transaction.exchangeRate + transaction.fees;
        this.wallets[transaction.fromCurrency] -= originalAmount;
      }
    }
  }

  /**
   * Revert wallet balances based on a transaction (inverse operation)
   * @param {Object} transaction - Transaction data
   */
  revertWalletBalances(transaction) {
    if (transaction.type === "sent") {
      // For sent money, add back to fromCurrency wallet
      this.wallets[transaction.fromCurrency] += transaction.amount;

      // If currency exchange, subtract from toCurrency wallet
      if (transaction.fromCurrency !== transaction.toCurrency) {
        const convertedAmount =
          transaction.amount * transaction.exchangeRate - transaction.fees;
        this.wallets[transaction.toCurrency] -= convertedAmount;
      }
    } else if (transaction.type === "received") {
      // For received money, subtract from toCurrency wallet
      this.wallets[transaction.toCurrency] -= transaction.amount;

      // If currency exchange, add back to fromCurrency wallet
      if (
        transaction.fromCurrency !== transaction.toCurrency &&
        transaction.fromCurrency !== "external"
      ) {
        const originalAmount =
          transaction.amount / transaction.exchangeRate + transaction.fees;
        this.wallets[transaction.fromCurrency] += originalAmount;
      }
    }
  }

  /**
   * Get monthly totals for transactions
   */
  getMonthlyTotals() {
    const monthlyData = {};

    this.transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          sent: 0,
          received: 0,
          net: 0,
          byCategory: {},
          byCurrency: {},
        };
      }

      // Update totals based on transaction type
      if (transaction.type === "sent") {
        monthlyData[monthKey].sent += transaction.amount;
        monthlyData[monthKey].net -= transaction.amount;
      } else {
        monthlyData[monthKey].received += transaction.amount;
        monthlyData[monthKey].net += transaction.amount;
      }

      // Track by category
      const category = transaction.category || "general";
      if (!monthlyData[monthKey].byCategory[category]) {
        monthlyData[monthKey].byCategory[category] = 0;
      }

      if (transaction.type === "sent") {
        monthlyData[monthKey].byCategory[category] -= transaction.amount;
      } else {
        monthlyData[monthKey].byCategory[category] += transaction.amount;
      }

      // Track by currency
      const currency = transaction.fromCurrency;
      if (!monthlyData[monthKey].byCurrency[currency]) {
        monthlyData[monthKey].byCurrency[currency] = {
          sent: 0,
          received: 0,
          net: 0,
        };
      }

      if (transaction.type === "sent") {
        monthlyData[monthKey].byCurrency[currency].sent += transaction.amount;
        monthlyData[monthKey].byCurrency[currency].net -= transaction.amount;
      } else {
        monthlyData[monthKey].byCurrency[currency].received +=
          transaction.amount;
        monthlyData[monthKey].byCurrency[currency].net += transaction.amount;
      }
    });

    return monthlyData;
  }

  /**
   * Get financial statistics
   */
  getFinancialStats() {
    const stats = {
      totalSent: 0,
      totalReceived: 0,
      netBalance: 0,
      wallets: this.wallets,
      recentActivity: "No recent activity",
      currencyDistribution: {},
      avgExchangeRates: {},
    };

    // Calculate basic totals
    this.transactions.forEach((transaction) => {
      if (transaction.type === "sent") {
        stats.totalSent += transaction.amount;
      } else {
        stats.totalReceived += transaction.amount;
      }
    });

    stats.netBalance = stats.totalReceived - stats.totalSent;

    // Get recent activity description
    if (this.transactions.length > 0) {
      const latest = this.transactions[0];
      const amount = formatCurrency(latest.amount);
      const date = formatDate(latest.date);

      if (latest.type === "sent") {
        stats.recentActivity = `Sent ${amount} ${latest.fromCurrency} on ${date}`;
      } else {
        stats.recentActivity = `Received ${amount} ${latest.toCurrency} on ${date}`;
      }
    }

    // Calculate currency distribution
    this.transactions.forEach((transaction) => {
      // Track fromCurrency
      if (!stats.currencyDistribution[transaction.fromCurrency]) {
        stats.currencyDistribution[transaction.fromCurrency] = 0;
      }

      if (transaction.type === "sent") {
        stats.currencyDistribution[transaction.fromCurrency] +=
          transaction.amount;
      }

      // Track toCurrency
      if (!stats.currencyDistribution[transaction.toCurrency]) {
        stats.currencyDistribution[transaction.toCurrency] = 0;
      }

      if (transaction.type === "received") {
        stats.currencyDistribution[transaction.toCurrency] +=
          transaction.amount;
      }
    });

    // Calculate average exchange rates
    const rates = {};

    this.transactions.forEach((transaction) => {
      if (
        transaction.fromCurrency !== transaction.toCurrency &&
        transaction.exchangeRate
      ) {
        const key = `${transaction.fromCurrency}/${transaction.toCurrency}`;

        if (!rates[key]) {
          rates[key] = {
            sum: 0,
            count: 0,
          };
        }

        rates[key].sum += transaction.exchangeRate;
        rates[key].count++;
      }
    });

    // Calculate averages
    for (const [key, data] of Object.entries(rates)) {
      stats.avgExchangeRates[key] = data.sum / data.count;
    }

    return stats;
  }

  /**
   * Get analytics data
   */
  getAnalyticsData() {
    const transactions = this.transactions;

    if (transactions.length === 0) {
      return null;
    }

    // Calculate analytics metrics
    const analytics = {
      totalTransactions: transactions.length,
      avgTransaction: 0,
      largestTransaction: 0,
      frequency: 0,
      growthRate: 0,
      profitLoss: 0,
      currencyPerformance: {},
    };

    // Average transaction amount
    let total = 0;
    transactions.forEach((t) => {
      total += t.amount;

      // Find largest transaction
      if (t.amount > analytics.largestTransaction) {
        analytics.largestTransaction = t.amount;
      }
    });

    analytics.avgTransaction = total / transactions.length;

    // Calculate transaction frequency (per month)
    const oldestTransaction = transactions[transactions.length - 1];
    const oldestDate = new Date(oldestTransaction.date);
    const today = new Date();
    const monthsDiff =
      (today.getFullYear() - oldestDate.getFullYear()) * 12 +
      today.getMonth() -
      oldestDate.getMonth();

    analytics.frequency =
      monthsDiff > 0 ? transactions.length / monthsDiff : transactions.length;

    // Calculate growth rate
    const monthlyTotals = this.getMonthlyTotals();
    const months = Object.keys(monthlyTotals).sort();

    if (months.length >= 2) {
      const oldestMonth = months[0];
      const latestMonth = months[months.length - 1];

      const oldValue = monthlyTotals[oldestMonth].net;
      const newValue = monthlyTotals[latestMonth].net;

      // Avoid division by zero
      if (oldValue !== 0) {
        analytics.growthRate =
          ((newValue - oldValue) / Math.abs(oldValue)) * 100;
      }
    }

    // Calculate profit/loss from currency exchange
    let exchangeProfit = 0;

    transactions.forEach((t) => {
      if (t.fromCurrency !== t.toCurrency && t.exchangeRate) {
        // For currency exchange transactions, calculate the profit/loss
        if (t.type === "sent") {
          // Calculate the value received in the original currency
          const convertedBack =
            (t.amount * t.exchangeRate - t.fees) / t.exchangeRate;
          exchangeProfit += convertedBack - t.amount;
        }
      }
    });

    analytics.profitLoss = exchangeProfit;

    // Calculate currency performance
    const currencies = new Set();
    transactions.forEach((t) => {
      currencies.add(t.fromCurrency);
      currencies.add(t.toCurrency);
    });

    currencies.forEach((currency) => {
      if (currency === "external") return;

      const currencyTransactions = transactions.filter(
        (t) => t.fromCurrency === currency || t.toCurrency === currency
      );

      if (currencyTransactions.length === 0) return;

      // Calculate average exchange rate over time
      const exchangeRates = [];

      currencyTransactions.forEach((t) => {
        if (t.fromCurrency !== t.toCurrency && t.exchangeRate) {
          let rate = t.exchangeRate;

          // Normalize rate to be currency/NGN
          if (t.toCurrency === "NGN" && t.fromCurrency === currency) {
            // Already in correct format
          } else if (t.fromCurrency === "NGN" && t.toCurrency === currency) {
            // Invert the rate
            rate = 1 / rate;
          }

          exchangeRates.push({
            date: new Date(t.date),
            rate: rate,
          });
        }
      });

      // Sort by date
      exchangeRates.sort((a, b) => a.date - b.date);

      if (exchangeRates.length >= 2) {
        const oldestRate = exchangeRates[0].rate;
        const newestRate = exchangeRates[exchangeRates.length - 1].rate;

        // Calculate percentage change
        const change = ((newestRate - oldestRate) / oldestRate) * 100;

        analytics.currencyPerformance[currency] = {
          change: change,
          oldestRate: oldestRate,
          newestRate: newestRate,
          dataPoints: exchangeRates.length,
        };
      }
    });

    return analytics;
  }

  /**
   * Get predictive data for projections
   */
  getPredictiveData() {
    // Get monthly totals
    const monthlyTotals = this.getMonthlyTotals();
    const months = Object.keys(monthlyTotals).sort();

    const predictions = {
      projectedSent: 0,
      projectedReceived: 0,
      projectedNet: 0,
      futureTrend: [],
      expectedRates: {},
    };

    // Calculate projections based on recent months
    if (months.length > 0) {
      // Take up to last 3 months for projections
      const recentMonths = months.slice(-3);

      let totalSent = 0;
      let totalReceived = 0;

      recentMonths.forEach((month) => {
        totalSent += monthlyTotals[month].sent;
        totalReceived += monthlyTotals[month].received;
      });

      // Calculate averages
      predictions.projectedSent = totalSent / recentMonths.length;
      predictions.projectedReceived = totalReceived / recentMonths.length;
      predictions.projectedNet =
        predictions.projectedReceived - predictions.projectedSent;

      // Build future trend (current + 3 months projection)
      const currentBalance = this.wallets["NGN"] || 0;

      predictions.futureTrend = [
        {
          month: "Current",
          balance: currentBalance,
        },
      ];

      let projectedBalance = currentBalance;

      for (let i = 1; i <= 3; i++) {
        projectedBalance += predictions.projectedNet;

        predictions.futureTrend.push({
          month: `Month ${i}`,
          balance: projectedBalance,
        });
      }

      // Predict future exchange rates based on historical data
      const currencies = ["USD", "GBP", "EUR"];

      currencies.forEach((currency) => {
        // Get historical rates for this currency from transactions
        const rates = [];

        this.transactions.forEach((t) => {
          if (
            (t.fromCurrency === currency && t.toCurrency === "NGN") ||
            (t.fromCurrency === "NGN" && t.toCurrency === currency)
          ) {
            let rate = t.exchangeRate;

            // Normalize to currency/NGN format
            if (t.fromCurrency === "NGN") {
              rate = 1 / rate;
            }

            rates.push({
              date: new Date(t.date),
              rate: rate,
            });
          }
        });

        // Sort by date
        rates.sort((a, b) => a.date - b.date);

        // If we have enough data points, make a projection
        if (rates.length >= 5) {
          // Simple linear regression
          const x = Array.from({ length: rates.length }, (_, i) => i);
          const y = rates.map((r) => r.rate);

          // Calculate linear regression parameters
          const n = x.length;
          const sumX = x.reduce((a, b) => a + b, 0);
          const sumY = y.reduce((a, b) => a + b, 0);
          const sumXY = x.reduce((sum, x, i) => sum + x * y[i], 0);
          const sumXX = x.reduce((sum, x) => sum + x * x, 0);

          const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
          const intercept = (sumY - slope * sumX) / n;

          // Predict future rates
          predictions.expectedRates[currency] = [];

          for (let i = 0; i < 3; i++) {
            const projectedRate = intercept + slope * (n + i);

            predictions.expectedRates[currency].push({
              month: `Month ${i + 1}`,
              rate: projectedRate,
            });
          }
        }
      });
    }

    return predictions;
  }
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Export the class
window.TransactionManager = TransactionManager;
