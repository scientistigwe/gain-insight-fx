/**
 * CurrencyManager - Handles currency exchange rate data and analysis
 * Manages historical rates, trends, and alerts for favorable exchange opportunities
 */
class CurrencyManager {
  constructor(userId) {
    this.userId = userId;
    this.db = firebase.firestore();
    this.currencies = ["USD", "GBP", "EUR"]; // Supported currencies against NGN
    this.rates = {}; // Current exchange rates
    this.historicalRates = {}; // Historical exchange rate data
    this.alerts = []; // Exchange rate alerts
    this.thresholds = {}; // User-defined thresholds for alerts
  }

  /**
   * Initialize the currency manager
   * @returns {Promise} Promise that resolves when initialization is complete
   */
  async initialize() {
    await this.loadUserPreferences();
    await this.fetchCurrentRates();
    await this.fetchHistoricalRates();
    this.setupRealTimeUpdates();
    return this;
  }

  /**
   * Load user preferences from Firestore
   */
  async loadUserPreferences() {
    try {
      const doc = await this.db
        .collection("userPreferences")
        .doc(this.userId)
        .get();

      if (doc.exists) {
        const data = doc.data();
        this.thresholds = data.thresholds || {};
        this.currencies = data.currencies || this.currencies;
      } else {
        // Set default thresholds if none exist
        const defaults = {};
        this.currencies.forEach((currency) => {
          defaults[currency] = {
            buy: 0, // Buy foreign currency when NGN rate falls below this
            sell: 0, // Sell foreign currency when NGN rate rises above this
          };
        });

        await this.db.collection("userPreferences").doc(this.userId).set({
          currencies: this.currencies,
          thresholds: defaults,
        });

        this.thresholds = defaults;
      }
    } catch (error) {
      console.error("Error loading user preferences:", error);
    }
  }

  /**
   * Update user preferences in Firestore
   * @param {Object} preferences - User preferences to update
   */
  async updateUserPreferences(preferences) {
    try {
      if (preferences.thresholds) {
        this.thresholds = preferences.thresholds;
      }

      if (preferences.currencies) {
        this.currencies = preferences.currencies;
      }

      await this.db.collection("userPreferences").doc(this.userId).update({
        currencies: this.currencies,
        thresholds: this.thresholds,
      });

      return true;
    } catch (error) {
      console.error("Error updating user preferences:", error);
      return false;
    }
  }

  /**
   * Fetch current exchange rates from API
   */
  async fetchCurrentRates() {
    try {
      // In production, this would use a real API
      // For now, we'll simulate with recent rates
      const response = await fetch(
        "https://api.exchangerate.host/latest?base=NGN"
      );
      const data = await response.json();

      if (data && data.rates) {
        // Convert from NGN as base to rates against NGN
        this.currencies.forEach((currency) => {
          // API gives rates like NGN/USD, but we want USD/NGN
          this.rates[currency] = 1 / data.rates[currency];
        });
      }

      // Store the current rates in Firestore for history
      await this.storeCurrentRates();

      // Check alerts
      this.checkAlerts();

      return this.rates;
    } catch (error) {
      console.error("Error fetching current rates:", error);
      // Fallback to last stored rates
      await this.loadLastStoredRates();
    }
  }

  /**
   * Store current rates in Firestore for historical tracking
   */
  async storeCurrentRates() {
    try {
      const timestamp = firebase.firestore.Timestamp.now();

      const rateData = {
        timestamp: timestamp,
        rates: this.rates,
        userId: this.userId,
      };

      await this.db.collection("exchangeRates").add(rateData);
    } catch (error) {
      console.error("Error storing current rates:", error);
    }
  }

  /**
   * Load last stored rates from Firestore
   */
  async loadLastStoredRates() {
    try {
      const snapshot = await this.db
        .collection("exchangeRates")
        .where("userId", "==", this.userId)
        .orderBy("timestamp", "desc")
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        this.rates = data.rates;
      }
    } catch (error) {
      console.error("Error loading last stored rates:", error);
    }
  }

  /**
   * Fetch historical exchange rates
   * @param {Number} days - Number of days of history to fetch (default 90)
   */
  async fetchHistoricalRates(days = 90) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // In production, fetch from API with date range
      // For demo, we'll get from Firestore
      const snapshot = await this.db
        .collection("exchangeRates")
        .where("userId", "==", this.userId)
        .where(
          "timestamp",
          ">=",
          firebase.firestore.Timestamp.fromDate(startDate)
        )
        .where(
          "timestamp",
          "<=",
          firebase.firestore.Timestamp.fromDate(endDate)
        )
        .orderBy("timestamp", "asc")
        .get();

      this.historicalRates = {};
      this.currencies.forEach((currency) => {
        this.historicalRates[currency] = [];
      });

      snapshot.forEach((doc) => {
        const data = doc.data();
        const date = data.timestamp.toDate();

        this.currencies.forEach((currency) => {
          if (data.rates && data.rates[currency]) {
            this.historicalRates[currency].push({
              date: date,
              rate: data.rates[currency],
            });
          }
        });
      });

      return this.historicalRates;
    } catch (error) {
      console.error("Error fetching historical rates:", error);
    }
  }

  /**
   * Setup real-time updates for exchange rates
   */
  setupRealTimeUpdates() {
    // In a real app, this might subscribe to websocket updates
    // For demo purposes, we'll set up a polling interval
    this.updateInterval = setInterval(() => {
      this.fetchCurrentRates();
    }, 3600000); // Update every hour
  }

  /**
   * Check for alert conditions based on thresholds
   */
  checkAlerts() {
    this.alerts = [];

    for (const currency of this.currencies) {
      const currentRate = this.rates[currency];
      const thresholds = this.thresholds[currency];

      if (!currentRate || !thresholds) continue;

      // Check buy alert (when rate is low - good time to buy foreign currency)
      if (thresholds.buy > 0 && currentRate <= thresholds.buy) {
        this.alerts.push({
          type: "buy",
          currency: currency,
          rate: currentRate,
          threshold: thresholds.buy,
          message: `Favorable rate to buy ${currency}: Current rate ${currentRate.toFixed(
            2
          )} NGN is below your threshold of ${thresholds.buy.toFixed(2)} NGN.`,
        });
      }

      // Check sell alert (when rate is high - good time to sell foreign currency)
      if (thresholds.sell > 0 && currentRate >= thresholds.sell) {
        this.alerts.push({
          type: "sell",
          currency: currency,
          rate: currentRate,
          threshold: thresholds.sell,
          message: `Favorable rate to sell ${currency}: Current rate ${currentRate.toFixed(
            2
          )} NGN is above your threshold of ${thresholds.sell.toFixed(2)} NGN.`,
        });
      }
    }

    // Return new alerts
    return this.alerts;
  }

  /**
   * Get trend analysis for a specific currency
   * @param {String} currency - Currency code (USD, GBP, etc.)
   * @param {Number} days - Number of days to analyze (default 30)
   * @returns {Object} Trend analysis
   */
  getTrendAnalysis(currency, days = 30) {
    if (
      !this.historicalRates[currency] ||
      this.historicalRates[currency].length === 0
    ) {
      return null;
    }

    // Filter for the specified time period
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const ratesInPeriod = this.historicalRates[currency].filter(
      (item) => item.date >= startDate && item.date <= endDate
    );

    if (ratesInPeriod.length < 2) {
      return null;
    }

    // Calculate statistics
    const rates = ratesInPeriod.map((item) => item.rate);
    const currentRate = rates[rates.length - 1];
    const oldestRate = rates[0];

    // Calculate min, max, avg
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const avg = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;

    // Calculate trend
    const changeAmount = currentRate - oldestRate;
    const changePercent = (changeAmount / oldestRate) * 100;

    // Determine trend direction
    let trend = "stable";
    if (changePercent > 2) trend = "rising";
    else if (changePercent < -2) trend = "falling";

    // Calculate volatility (standard deviation)
    const variance =
      rates.reduce((sum, rate) => sum + Math.pow(rate - avg, 2), 0) /
      rates.length;
    const volatility = Math.sqrt(variance);

    // Predict future movement (simple linear regression)
    const prediction = this.predictFutureRate(currency, 7); // Predict 7 days ahead

    return {
      currency,
      currentRate,
      changeAmount,
      changePercent,
      min,
      max,
      avg,
      trend,
      volatility,
      predictedRate: prediction.rate,
      confidence: prediction.confidence,
    };
  }

  /**
   * Predict future exchange rate using simple linear regression
   * @param {String} currency - Currency code
   * @param {Number} daysAhead - Number of days ahead to predict
   * @returns {Object} Predicted rate and confidence score
   */
  predictFutureRate(currency, daysAhead = 7) {
    if (
      !this.historicalRates[currency] ||
      this.historicalRates[currency].length < 10
    ) {
      return { rate: this.rates[currency], confidence: 0 };
    }

    // Get recent data points (last 30 days)
    const recentRates = this.historicalRates[currency].slice(-30);

    // Prepare data for linear regression
    const x = Array.from({ length: recentRates.length }, (_, i) => i);
    const y = recentRates.map((item) => item.rate);

    // Calculate linear regression parameters
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict future rate
    const predictedRate = intercept + slope * (n + daysAhead);

    // Calculate R-squared to determine confidence
    const meanY = sumY / n;
    const totalSumSquares = y.reduce(
      (sum, val) => sum + Math.pow(val - meanY, 2),
      0
    );
    const predictedValues = x.map((val) => intercept + slope * val);
    const residualSumSquares = y.reduce(
      (sum, val, i) => sum + Math.pow(val - predictedValues[i], 2),
      0
    );
    const rSquared = 1 - residualSumSquares / totalSumSquares;

    // Limit prediction to reasonable bounds (not too far from current rate)
    const currentRate = this.rates[currency];
    const maxChange = currentRate * 0.15; // Max 15% change

    let boundedRate = predictedRate;
    if (predictedRate > currentRate + maxChange) {
      boundedRate = currentRate + maxChange;
    } else if (predictedRate < currentRate - maxChange) {
      boundedRate = currentRate - maxChange;
    }

    return {
      rate: Math.max(boundedRate, 0), // Ensure rate is positive
      confidence: Math.max(0, Math.min(1, rSquared)), // Bound between 0 and 1
    };
  }

  /**
   * Get optimal times to trade based on historical patterns
   * @param {String} currency - Currency code
   * @returns {Object} Optimal trading times
   */
  getOptimalTradingTimes(currency) {
    if (
      !this.historicalRates[currency] ||
      this.historicalRates[currency].length < 30
    ) {
      return null;
    }

    // Group rates by day of week to find patterns
    const dayStats = [0, 1, 2, 3, 4, 5, 6].map(() => ({
      rates: [],
      volatility: 0,
    }));

    this.historicalRates[currency].forEach((item) => {
      const dayOfWeek = item.date.getDay();
      dayStats[dayOfWeek].rates.push(item.rate);
    });

    // Calculate average and volatility for each day
    dayStats.forEach((day) => {
      if (day.rates.length > 0) {
        const avg =
          day.rates.reduce((sum, rate) => sum + rate, 0) / day.rates.length;
        const variance =
          day.rates.reduce((sum, rate) => sum + Math.pow(rate - avg, 2), 0) /
          day.rates.length;
        day.avg = avg;
        day.volatility = Math.sqrt(variance);
      }
    });

    // Find best day to buy (lowest average rate)
    const buyDay = dayStats
      .map((stats, index) => ({ day: index, avg: stats.avg }))
      .filter((item) => !isNaN(item.avg))
      .sort((a, b) => a.avg - b.avg)[0];

    // Find best day to sell (highest average rate)
    const sellDay = dayStats
      .map((stats, index) => ({ day: index, avg: stats.avg }))
      .filter((item) => !isNaN(item.avg))
      .sort((a, b) => b.avg - a.avg)[0];

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    return {
      currency,
      buyDay: buyDay
        ? {
            name: dayNames[buyDay.day],
            avgRate: buyDay.avg,
          }
        : null,
      sellDay: sellDay
        ? {
            name: dayNames[sellDay.day],
            avgRate: sellDay.avg,
          }
        : null,
      dayStats: dayStats
        .map((stats, index) => ({
          day: dayNames[index],
          avgRate: stats.avg,
          volatility: stats.volatility,
        }))
        .filter((day) => !isNaN(day.avgRate)),
    };
  }

  /**
   * Set alert thresholds for a currency
   * @param {String} currency - Currency code
   * @param {Number} buyThreshold - Buy alert threshold
   * @param {Number} sellThreshold - Sell alert threshold
   */
  async setAlertThresholds(currency, buyThreshold, sellThreshold) {
    try {
      if (!this.thresholds[currency]) {
        this.thresholds[currency] = { buy: 0, sell: 0 };
      }

      this.thresholds[currency].buy = buyThreshold;
      this.thresholds[currency].sell = sellThreshold;

      await this.updateUserPreferences({ thresholds: this.thresholds });

      // Check if current rates trigger any alerts
      this.checkAlerts();

      return true;
    } catch (error) {
      console.error("Error setting alert thresholds:", error);
      return false;
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

// Export the class
window.CurrencyManager = CurrencyManager;
