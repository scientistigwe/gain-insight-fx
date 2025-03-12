import React, { createContext, useState, useEffect } from "react";
import { getCurrentRates } from "../api/currencies";

export const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currencyRates, setCurrencyRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchCurrencyRates = async () => {
    setLoading(true);
    try {
      const response = await getCurrentRates();
      setCurrencyRates(response.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Error fetching currency rates:", err);
      setError("Failed to load currency rates. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch currency rates on mount
  useEffect(() => {
    fetchCurrencyRates();

    // Optional: Set up interval to periodically refresh rates
    const interval = setInterval(() => {
      fetchCurrencyRates();
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Function to find a specific currency rate
  const findExchangeRate = (fromCurrencyId, toCurrencyId) => {
    // Direct rate
    const directRate = currencyRates.find(
      (r) =>
        r.base_currency.id === fromCurrencyId &&
        r.quote_currency.id === toCurrencyId
    );

    if (directRate) {
      return directRate.rate;
    }

    // Inverse rate
    const inverseRate = currencyRates.find(
      (r) =>
        r.base_currency.id === toCurrencyId &&
        r.quote_currency.id === fromCurrencyId
    );

    if (inverseRate) {
      return 1 / inverseRate.rate;
    }

    return null;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currencyRates,
        loading,
        error,
        lastUpdated,
        refreshRates: fetchCurrencyRates,
        findExchangeRate,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};
