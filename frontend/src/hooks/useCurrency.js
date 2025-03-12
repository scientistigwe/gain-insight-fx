import { useState, useEffect, useContext } from "react";
import { getHistoricalRates, getTrends } from "../api/currencies";
import { CurrencyContext } from "../context/CurrencyContext";

export const useCurrency = (currencyCode, days = 30) => {
  const { currencyRates, loading: ratesLoading } = useContext(CurrencyContext);
  const [historicalRates, setHistoricalRates] = useState([]);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!currencyCode) return;

      setLoading(true);
      try {
        // Get historical data and trends in parallel
        const [historicalResponse, trendResponse] = await Promise.all([
          getHistoricalRates(currencyCode, days),
          getTrends(currencyCode, days),
        ]);

        setHistoricalRates(historicalResponse.data);
        setTrends(trendResponse.data);
        setError(null);
      } catch (err) {
        console.error(`Error fetching data for ${currencyCode}:`, err);
        setError(err.response?.data?.detail || "Failed to fetch currency data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currencyCode, days]);

  // Find a specific currency by code
  const findCurrencyByCode = (code) => {
    if (!code || !currencyRates || currencyRates.length === 0) return null;

    const currency = currencyRates.find(
      (rate) =>
        rate.base_currency.code === code || rate.quote_currency.code === code
    );

    if (!currency) return null;

    return currency.base_currency.code === code
      ? currency.base_currency
      : currency.quote_currency;
  };

  return {
    currencyRates,
    historicalRates,
    trends,
    loading: loading || ratesLoading,
    error,
    findCurrencyByCode,
  };
};
