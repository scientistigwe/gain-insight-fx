// Initialize Firestore
const db = firebase.firestore();

// Transaction data management
class TransactionManager {
  constructor(userId) {
    this.userId = userId;
    this.transactionsCollection = db
      .collection("users")
      .doc(userId)
      .collection("transactions");
    this.transactions = [];
  }

  // Get all transactions
  async getAllTransactions() {
    try {
      const snapshot = await this.transactionsCollection
        .orderBy("date", "desc")
        .get();
      this.transactions = [];

      snapshot.forEach((doc) => {
        const transaction = {
          id: doc.id,
          ...doc.data(),
        };
        this.transactions.push(transaction);
      });

      return this.calculateBalances(this.transactions);
    } catch (error) {
      console.error("Error getting transactions:", error);
      throw error;
    }
  }

  // Get filtered transactions
  async getFilteredTransactions(filters = {}) {
    try {
      let query = this.transactionsCollection.orderBy("date", "desc");

      // Apply type filter
      if (filters.type && filters.type !== "all") {
        query = query.where("type", "==", filters.type);
      }

      // Apply date range filter
      if (filters.dateRange) {
        const today = new Date();
        let startDate;

        if (filters.dateRange === "month") {
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        } else if (filters.dateRange === "quarter") {
          const quarter = Math.floor(today.getMonth() / 3);
          startDate = new Date(today.getFullYear(), quarter * 3, 1);
        } else if (filters.dateRange === "year") {
          startDate = new Date(today.getFullYear(), 0, 1);
        }

        if (startDate) {
          const startDateStr = startDate.toISOString().split("T")[0];
          query = query.where("date", ">=", startDateStr);
        }
      }

      const snapshot = await query.get();
      let transactions = [];

      snapshot.forEach((doc) => {
        const transaction = {
          id: doc.id,
          ...doc.data(),
        };
        transactions.push(transaction);
      });

      // Apply search filter (client-side)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        transactions = transactions.filter((transaction) =>
          transaction.description.toLowerCase().includes(searchTerm)
        );
      }

      return this.calculateBalances(transactions);
    } catch (error) {
      console.error("Error getting filtered transactions:", error);
      throw error;
    }
  }

  // Calculate running balance for each transaction
  calculateBalances(transactions) {
    // Sort by date (oldest first for balance calculation)
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    let runningBalance = 0;

    sortedTransactions.forEach((transaction) => {
      if (transaction.type === "received") {
        runningBalance += parseFloat(transaction.amount);
      } else {
        runningBalance -= parseFloat(transaction.amount);
      }
      transaction.balance = runningBalance;
    });

    return sortedTransactions;
  }

  // Add a new transaction
  async addTransaction(transactionData) {
    try {
      // Add timestamp for sorting/filtering
      const data = {
        ...transactionData,
        amount: parseFloat(transactionData.amount),
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      };

      await this.transactionsCollection.add(data);
      return this.getAllTransactions(); // Refresh the list
    } catch (error) {
      console.error("Error adding transaction:", error);
      throw error;
    }
  }

  // Update an existing transaction
  async updateTransaction(id, transactionData) {
    try {
      const data = {
        ...transactionData,
        amount: parseFloat(transactionData.amount),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      await this.transactionsCollection.doc(id).update(data);
      return this.getAllTransactions(); // Refresh the list
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  }

  // Delete a transaction
  async deleteTransaction(id) {
    try {
      await this.transactionsCollection.doc(id).delete();
      return this.getAllTransactions(); // Refresh the list
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }
  }

  // Get financial statistics
  getFinancialStats() {
    let totalSent = 0;
    let totalReceived = 0;

    this.transactions.forEach((transaction) => {
      if (transaction.type === "sent") {
        totalSent += parseFloat(transaction.amount);
      } else {
        totalReceived += parseFloat(transaction.amount);
      }
    });

    const netBalance = totalReceived - totalSent;

    // Get most recent transaction
    let recentActivity = "No activity";
    if (this.transactions.length > 0) {
      const mostRecent = this.transactions[0]; // Assuming sorted by date desc
      const date = new Date(mostRecent.date).toLocaleDateString();
      const amount = formatCurrency(mostRecent.amount);
      recentActivity = `${
        mostRecent.type === "received" ? "Received" : "Sent"
      } ${amount} on ${date}`;
    }

    return {
      totalSent,
      totalReceived,
      netBalance,
      recentActivity,
    };
  }

  // Get data for analytics
  getAnalyticsData() {
    if (this.transactions.length === 0) return null;

    // Calculate average transaction amount
    const totalAmount = this.transactions.reduce(
      (sum, transaction) => sum + parseFloat(transaction.amount),
      0
    );
    const avgTransaction = totalAmount / this.transactions.length;

    // Find largest transaction
    const largestTransaction = this.transactions.reduce(
      (max, transaction) =>
        parseFloat(transaction.amount) > parseFloat(max.amount)
          ? transaction
          : max,
      { amount: 0 }
    );

    // Calculate transaction frequency (per month)
    const dates = this.transactions.map((t) => new Date(t.date));
    const oldestDate = new Date(Math.min(...dates));
    const newestDate = new Date(Math.max(...dates));
    const monthDiff =
      (newestDate.getFullYear() - oldestDate.getFullYear()) * 12 +
      (newestDate.getMonth() - oldestDate.getMonth()) +
      1;
    const frequency = this.transactions.length / Math.max(1, monthDiff);

    // Calculate growth rate
    let growthRate = 0;
    if (this.transactions.length > 1) {
      const monthlyTotals = this.getMonthlyTotals();
      const months = Object.keys(monthlyTotals).sort();

      if (months.length >= 2) {
        const previousMonth = monthlyTotals[months[months.length - 2]].net;
        const currentMonth = monthlyTotals[months[months.length - 1]].net;

        if (previousMonth !== 0) {
          growthRate =
            ((currentMonth - previousMonth) / Math.abs(previousMonth)) * 100;
        }
      }
    }

    return {
      avgTransaction,
      largestTransaction: largestTransaction.amount,
      frequency,
      growthRate,
    };
  }

  // Get monthly totals for charts
  getMonthlyTotals() {
    const monthlyData = {};

    this.transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const yearMonth = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthlyData[yearMonth]) {
        monthlyData[yearMonth] = {
          sent: 0,
          received: 0,
          net: 0,
        };
      }

      const amount = parseFloat(transaction.amount);

      if (transaction.type === "sent") {
        monthlyData[yearMonth].sent += amount;
        monthlyData[yearMonth].net -= amount;
      } else {
        monthlyData[yearMonth].received += amount;
        monthlyData[yearMonth].net += amount;
      }
    });

    return monthlyData;
  }

  // Generate predictive data based on historical trends
  getPredictiveData() {
    if (this.transactions.length < 3) {
      return {
        projectedSent: 0,
        projectedReceived: 0,
        projectedNet: 0,
        confidenceLevel: "Low",
        futureTrend: [],
      };
    }

    const monthlyTotals = this.getMonthlyTotals();
    const months = Object.keys(monthlyTotals).sort();

    // Need at least 3 months of data for meaningful prediction
    if (months.length < 3) {
      return {
        projectedSent: 0,
        projectedReceived: 0,
        projectedNet: 0,
        confidenceLevel: "Low",
        futureTrend: [],
      };
    }

    // Calculate average monthly sent and received
    let totalSent = 0;
    let totalReceived = 0;

    months.forEach((month) => {
      totalSent += monthlyTotals[month].sent;
      totalReceived += monthlyTotals[month].received;
    });

    const avgSent = totalSent / months.length;
    const avgReceived = totalReceived / months.length;

    // Calculate trend (use last 3 months for simplicity)
    const recentMonths = months.slice(-3);
    const recentNet = recentMonths.map((month) => monthlyTotals[month].net);

    // Simple linear regression for trend
    let trend = 0;
    if (recentNet.length > 1) {
      trend =
        (recentNet[recentNet.length - 1] - recentNet[0]) /
        (recentNet.length - 1);
    }

    // Project next 3 months
    const lastBalance = this.transactions[0].balance;
    const futureTrend = [
      {
        month: "Current",
        balance: lastBalance,
      },
    ];

    let predictedBalance = lastBalance;
    for (let i = 1; i <= 3; i++) {
      predictedBalance += avgReceived - avgSent + trend * i;
      futureTrend.push({
        month: `Month ${i}`,
        balance: predictedBalance,
      });
    }

    // Determine confidence level based on data consistency
    let confidenceLevel = "Medium";

    // If we have more than 6 months of data, increase confidence
    if (months.length > 6) {
      confidenceLevel = "High";
    }

    // If transaction amounts are highly variable, decrease confidence
    const amounts = this.transactions.map((t) => parseFloat(t.amount));
    const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const variance =
      amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      amounts.length;
    const stdDev = Math.sqrt(variance);
    const coeffOfVariation = stdDev / mean;

    if (coeffOfVariation > 0.8) {
      confidenceLevel = "Low";
    } else if (coeffOfVariation > 0.5 && confidenceLevel !== "Low") {
      confidenceLevel = "Medium";
    }

    return {
      projectedSent: avgSent,
      projectedReceived: avgReceived,
      projectedNet: avgReceived - avgSent,
      confidenceLevel,
      futureTrend,
    };
  }
}

// Format currency for display
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}
