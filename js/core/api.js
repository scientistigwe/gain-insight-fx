/**
 * API Module - Handles external API calls for exchange rate data
 */

const ExchangeRateAPI = {
  /**
   * Fetch latest exchange rates
   * @param {String} base - Base currency code (e.g., 'NGN')
   * @param {Array} symbols - Array of currency codes to fetch (e.g., ['USD', 'GBP', 'EUR'])
   * @returns {Promise} Promise resolving to exchange rate data
   */
  getLatestRates: async function (
    base = "NGN",
    symbols = ["USD", "GBP", "EUR"]
  ) {
    try {
      const symbolsParam = symbols.join(",");
      const url = `https://api.exchangerate.host/latest?base=${base}&symbols=${symbolsParam}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!data || !data.success) {
        throw new Error("Failed to fetch exchange rates");
      }

      return data;
    } catch (error) {
      console.error("Error fetching latest rates:", error);
      throw error;
    }
  },

  /**
   * Fetch historical exchange rates
   * @param {String} date - Date in YYYY-MM-DD format
   * @param {String} base - Base currency code (e.g., 'NGN')
   * @param {Array} symbols - Array of currency codes to fetch
   * @returns {Promise} Promise resolving to historical exchange rate data
   */
  getHistoricalRates: async function (
    date,
    base = "NGN",
    symbols = ["USD", "GBP", "EUR"]
  ) {
    try {
      const symbolsParam = symbols.join(",");
      const url = `https://api.exchangerate.host/${date}?base=${base}&symbols=${symbolsParam}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!data || !data.success) {
        throw new Error("Failed to fetch historical rates");
      }

      return data;
    } catch (error) {
      console.error("Error fetching historical rates:", error);
      throw error;
    }
  },

  /**
   * Fetch time series exchange rates
   * @param {String} startDate - Start date in YYYY-MM-DD format
   * @param {String} endDate - End date in YYYY-MM-DD format
   * @param {String} base - Base currency code (e.g., 'NGN')
   * @param {Array} symbols - Array of currency codes to fetch
   * @returns {Promise} Promise resolving to time series exchange rate data
   */
  getTimeSeries: async function (
    startDate,
    endDate,
    base = "NGN",
    symbols = ["USD", "GBP", "EUR"]
  ) {
    try {
      const symbolsParam = symbols.join(",");
      const url = `https://api.exchangerate.host/timeseries?start_date=${startDate}&end_date=${endDate}&base=${base}&symbols=${symbolsParam}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!data || !data.success) {
        throw new Error("Failed to fetch time series");
      }

      return data;
    } catch (error) {
      console.error("Error fetching time series:", error);
      throw error;
    }
  },

  /**
   * Convert an amount from one currency to another
   * @param {Number} amount - Amount to convert
   * @param {String} from - From currency code
   * @param {String} to - To currency code
   * @returns {Promise} Promise resolving to conversion result
   */
  convertCurrency: async function (amount, from, to) {
    try {
      const url = `https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=${amount}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!data || !data.success) {
        throw new Error("Failed to convert currency");
      }

      return data;
    } catch (error) {
      console.error("Error converting currency:", error);
      throw error;
    }
  },

  /**
   * Fetch exchange rate fluctuation data
   * @param {String} startDate - Start date in YYYY-MM-DD format
   * @param {String} endDate - End date in YYYY-MM-DD format
   * @param {String} base - Base currency code (e.g., 'NGN')
   * @param {Array} symbols - Array of currency codes to fetch
   * @returns {Promise} Promise resolving to fluctuation data
   */
  getFluctuation: async function (
    startDate,
    endDate,
    base = "NGN",
    symbols = ["USD", "GBP", "EUR"]
  ) {
    try {
      const symbolsParam = symbols.join(",");
      const url = `https://api.exchangerate.host/fluctuation?start_date=${startDate}&end_date=${endDate}&base=${base}&symbols=${symbolsParam}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!data || !data.success) {
        throw new Error("Failed to fetch fluctuation data");
      }

      return data;
    } catch (error) {
      console.error("Error fetching fluctuation data:", error);
      throw error;
    }
  },

  /**
   * Fetch central bank of Nigeria rates (simulated)
   * @returns {Promise} Promise resolving to CBN rate data
   */
  getCBNRates: async function () {
    try {
      // In a real implementation, this would call a CBN API or scrape the CBN website
      // For demo purposes, we'll return simulated data
      return {
        source: "Central Bank of Nigeria",
        date: new Date().toISOString().split("T")[0],
        rates: {
          USD: 1559.25,
          GBP: 1967.42,
          EUR: 1686.35,
        },
      };
    } catch (error) {
      console.error("Error fetching CBN rates:", error);
      throw error;
    }
  },

  /**
   * Fetch parallel market rates (simulated)
   * @returns {Promise} Promise resolving to parallel market rate data
   */
  getParallelMarketRates: async function () {
    try {
      // In a real implementation, this would scrape parallel market rate websites
      // For demo purposes, we'll return simulated data with a premium over CBN rates
      const cbnRates = await this.getCBNRates();

      return {
        source: "Parallel Market",
        date: cbnRates.date,
        rates: {
          USD: cbnRates.rates.USD * 1.05, // 5% premium
          GBP: cbnRates.rates.GBP * 1.05,
          EUR: cbnRates.rates.EUR * 1.05,
        },
      };
    } catch (error) {
      console.error("Error fetching parallel market rates:", error);
      throw error;
    }
  },
};

// Export the API
window.ExchangeRateAPI = ExchangeRateAPI;
