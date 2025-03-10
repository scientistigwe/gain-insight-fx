/**
 * ExchangeRateScraper - Web scraper for currency exchange rate data
 * Fetches data from multiple sources to build a comprehensive view
 */
class ExchangeRateScraper {
  constructor() {
    this.sources = [
      {
        name: "Central Bank of Nigeria",
        url: "https://www.cbn.gov.ng/rates/ExchRateByCurrency.asp",
        parser: this.parseCBN,
      },
      {
        name: "FMDQ Exchange",
        url: "https://fmdqgroup.com/markets/products/currencies/",
        parser: this.parseFMDQ,
      },
      {
        name: "AbokiFX",
        url: "https://abokifx.com/",
        parser: this.parseAbokiFX,
      },
      {
        name: "Global Rates API",
        url: "https://api.exchangerate.host/latest?base=NGN",
        parser: this.parseExchangeRateAPI,
      },
    ];

    this.proxyUrl = "https://corsproxy.io/?"; // CORS proxy for client-side scraping
  }

  /**
   * Fetch exchange rates from all configured sources
   * @returns {Promise<Object>} Consolidated exchange rate data
   */
  async fetchAllSources() {
    const results = [];

    for (const source of this.sources) {
      try {
        const data = await this.fetchSource(source);
        if (data) {
          results.push({
            source: source.name,
            timestamp: new Date(),
            rates: data,
          });
        }
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error);
      }
    }

    return this.consolidateResults(results);
  }

  /**
   * Fetch exchange rates from a specific source
   * @param {Object} source - Source configuration
   * @returns {Promise<Object>} Exchange rate data
   */
  async fetchSource(source) {
    try {
      // For API sources (JSON responses)
      if (source.url.includes("api.")) {
        const response = await fetch(source.url);
        const data = await response.json();
        return source.parser(data);
      }

      // For web sources (HTML responses)
      // Using proxy to bypass CORS restrictions
      const response = await fetch(
        this.proxyUrl + encodeURIComponent(source.url)
      );
      const text = await response.text();
      return source.parser(text);
    } catch (error) {
      console.error(`Error fetching from ${source.name}:`, error);
      return null;
    }
  }

  /**
   * Parse Central Bank of Nigeria exchange rates
   * @param {String} html - HTML content
   * @returns {Object} Parsed exchange rates
   */
  parseCBN(html) {
    // Note: In a real implementation, we'd use DOM parsing
    // For demo, we'll simulate the parsing result

    // Create a temporary DOM element to parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const rates = {};

    try {
      // Find the table with exchange rates
      const rows = doc.querySelectorAll("table.data-table tr");

      // Skip header row
      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll("td");
        if (cells.length >= 3) {
          const currency = cells[0].textContent.trim();
          const rate = parseFloat(
            cells[2].textContent.trim().replace(/,/g, "")
          );

          if (!isNaN(rate)) {
            if (currency === "US DOLLAR") rates["USD"] = rate;
            else if (currency === "POUNDS STERLING") rates["GBP"] = rate;
            else if (currency === "EURO") rates["EUR"] = rate;
          }
        }
      }
    } catch (error) {
      console.error("Error parsing CBN rates:", error);
    }

    return rates;
  }

  /**
   * Parse FMDQ Exchange rates
   * @param {String} html - HTML content
   * @returns {Object} Parsed exchange rates
   */
  parseFMDQ(html) {
    // Note: In a real implementation, we'd use DOM parsing
    // For demo, we'll simulate the parsing result

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const rates = {};

    try {
      // Find the table with exchange rates
      const tables = doc.querySelectorAll("table");
      let ratesTable = null;

      // Find the correct table
      for (const table of tables) {
        if (table.textContent.includes("USD/NGN")) {
          ratesTable = table;
          break;
        }
      }

      if (ratesTable) {
        const rows = ratesTable.querySelectorAll("tr");

        for (const row of rows) {
          const cells = row.querySelectorAll("td");
          if (cells.length >= 2) {
            const text = cells[0].textContent.trim();
            const rate = parseFloat(
              cells[1].textContent.trim().replace(/,/g, "")
            );

            if (!isNaN(rate)) {
              if (text.includes("USD/NGN")) rates["USD"] = rate;
              else if (text.includes("GBP/NGN")) rates["GBP"] = rate;
              else if (text.includes("EUR/NGN")) rates["EUR"] = rate;
            }
          }
        }
      }
    } catch (error) {
      console.error("Error parsing FMDQ rates:", error);
    }

    return rates;
  }

  /**
   * Parse AbokiFX exchange rates
   * @param {String} html - HTML content
   * @returns {Object} Parsed exchange rates
   */
  parseAbokiFX(html) {
    // Note: In a real implementation, we'd use DOM parsing
    // For demo, we'll simulate the parsing result

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const rates = {};

    try {
      // Look for rate containers
      const containers = doc.querySelectorAll(
        ".currency-market-rate, .rate-container"
      );

      for (const container of containers) {
        if (container.textContent.includes("USD")) {
          const rateText = container
            .querySelector(".rate, .value")
            ?.textContent.trim();
          const rate = parseFloat(rateText.replace(/[^\d.]/g, ""));
          if (!isNaN(rate)) rates["USD"] = rate;
        } else if (container.textContent.includes("GBP")) {
          const rateText = container
            .querySelector(".rate, .value")
            ?.textContent.trim();
          const rate = parseFloat(rateText.replace(/[^\d.]/g, ""));
          if (!isNaN(rate)) rates["GBP"] = rate;
        } else if (container.textContent.includes("EUR")) {
          const rateText = container
            .querySelector(".rate, .value")
            ?.textContent.trim();
          const rate = parseFloat(rateText.replace(/[^\d.]/g, ""));
          if (!isNaN(rate)) rates["EUR"] = rate;
        }
      }
    } catch (error) {
      console.error("Error parsing AbokiFX rates:", error);
    }

    return rates;
  }

  /**
   * Parse Exchange Rate API response
   * @param {Object} data - API response data
   * @returns {Object} Parsed exchange rates
   */
  parseExchangeRateAPI(data) {
    const rates = {};

    try {
      if (data && data.rates) {
        // Convert from NGN as base to rates against NGN
        if (data.rates.USD) rates.USD = 1 / data.rates.USD;
        if (data.rates.GBP) rates.GBP = 1 / data.rates.GBP;
        if (data.rates.EUR) rates.EUR = 1 / data.rates.EUR;
      }
    } catch (error) {
      console.error("Error parsing API rates:", error);
    }

    return rates;
  }

  /**
   * Consolidate results from multiple sources
   * @param {Array} results - Results from different sources
   * @returns {Object} Consolidated rates and metadata
   */
  consolidateResults(results) {
    if (results.length === 0) {
      return {
        timestamp: new Date(),
        rates: {},
        sources: [],
        reliability: 0,
      };
    }

    const currencies = ["USD", "GBP", "EUR"];
    const consolidated = {
      timestamp: new Date(),
      rates: {},
      sources: results.map((r) => r.source),
      sourceData: results,
      reliability: {},
    };

    // Calculate consolidated rates for each currency
    for (const currency of currencies) {
      const values = results
        .filter((r) => r.rates && r.rates[currency])
        .map((r) => r.rates[currency]);

      if (values.length > 0) {
        // Calculate average
        const sum = values.reduce((acc, val) => acc + val, 0);
        const avg = sum / values.length;

        // Calculate standard deviation to identify outliers
        const squareDiffs = values.map((value) => Math.pow(value - avg, 2));
        const avgSquareDiff =
          squareDiffs.reduce((acc, val) => acc + val, 0) / values.length;
        const stdDev = Math.sqrt(avgSquareDiff);

        // Filter out outliers (more than 2 standard deviations from mean)
        const validValues = values.filter(
          (value) => Math.abs(value - avg) <= 2 * stdDev
        );

        // Calculate final consolidated rate (outliers removed)
        if (validValues.length > 0) {
          const validSum = validValues.reduce((acc, val) => acc + val, 0);
          consolidated.rates[currency] = validSum / validValues.length;

          // Calculate reliability score (0-1) based on agreement between sources
          const maxDiff = Math.max(...validValues) - Math.min(...validValues);
          const relativeDiff = maxDiff / consolidated.rates[currency];
          consolidated.reliability[currency] = Math.max(0, 1 - relativeDiff);
        } else {
          consolidated.rates[currency] = avg;
          consolidated.reliability[currency] = 0.5; // Medium reliability due to outliers
        }
      }
    }

    return consolidated;
  }

  /**
   * Schedule periodic updates of exchange rates
   * @param {Function} callback - Function to call with updated rates
   * @param {Number} intervalMinutes - Update interval in minutes
   * @returns {Number} Interval ID
   */
  scheduleUpdates(callback, intervalMinutes = 60) {
    const intervalMs = intervalMinutes * 60 * 1000;

    // Fetch immediately on start
    this.fetchAllSources().then((data) => {
      if (callback) callback(data);
    });

    // Set up interval for future updates
    const intervalId = setInterval(() => {
      this.fetchAllSources().then((data) => {
        if (callback) callback(data);
      });
    }, intervalMs);

    return intervalId;
  }

  /**
   * Get news and events that might impact exchange rates
   * @returns {Promise<Array>} Array of relevant news items
   */
  async getRelevantNews() {
    try {
      // In a real implementation, we would fetch from news APIs
      // For demo, we'll return sample data

      return [
        {
          title: "CBN announces new forex policies",
          source: "Central Bank of Nigeria",
          date: new Date(),
          url: "https://www.cbn.gov.ng/news/...",
          relevance: 0.9,
          sentiment: "positive", // positive, negative, neutral
          summary:
            "The Central Bank of Nigeria announced new policies to stabilize the forex market...",
        },
        {
          title: "Oil prices surge on global markets",
          source: "CNBC",
          date: new Date(),
          url: "https://www.cnbc.com/...",
          relevance: 0.8,
          sentiment: "positive",
          summary:
            "Oil prices increased by 5% today, potentially strengthening the Naira...",
        },
        {
          title: "Manufacturing output drops in Q1",
          source: "Business Day",
          date: new Date(),
          url: "https://businessday.ng/...",
          relevance: 0.7,
          sentiment: "negative",
          summary:
            "Manufacturing sector reports decreased output, potentially impacting foreign exchange demand...",
        },
      ];
    } catch (error) {
      console.error("Error fetching news:", error);
      return [];
    }
  }

  /**
   * Get economic indicators that may affect exchange rates
   * @returns {Promise<Object>} Economic indicators
   */
  async getEconomicIndicators() {
    try {
      // In a real implementation, we would fetch from economic data APIs
      // For demo, we'll return sample data

      return {
        timestamp: new Date(),
        indicators: {
          inflation: {
            value: 18.7,
            change: 0.5,
            date: new Date(),
            impact: "high",
          },
          gdpGrowth: {
            value: 2.3,
            change: -0.2,
            date: new Date(),
            impact: "medium",
          },
          interestRate: {
            value: 22.75,
            change: 0,
            date: new Date(),
            impact: "high",
          },
          oilPrice: {
            value: 85.42,
            change: 2.3,
            unit: "USD/barrel",
            date: new Date(),
            impact: "high",
          },
          foreignReserves: {
            value: 33.2,
            change: -0.3,
            unit: "billion USD",
            date: new Date(),
            impact: "high",
          },
        },
      };
    } catch (error) {
      console.error("Error fetching economic indicators:", error);
      return {
        timestamp: new Date(),
        indicators: {},
      };
    }
  }
}
