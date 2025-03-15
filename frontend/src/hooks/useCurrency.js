import { useState, useEffect, useCallback } from "react";
import {
  getCurrentRates,
  getHistoricalRates,
  getCurrencyTrends,
} from "../api/currencies";
import { useAuth } from "./useAuth"; // Add this import

export const useCurrency = () => {
  const { isAuthenticated } = useAuth(); // Get authentication state
  const [currentRates, setCurrentRates] = useState({});
  const [historicalRates, setHistoricalRates] = useState({});
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCurrentRates = useCallback(
    async (params) => {
      if (!isAuthenticated) {
        console.warn(
          "Attempted to fetch current rates while not authenticated"
        );
        return {};
      }

      setLoading(true);
      setError(null);
      try {
        const response = await getCurrentRates(params);
        setCurrentRates(response.data);
        return response.data;
      } catch (err) {
        setError(err);
        console.error("Error fetching currency rates:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  const fetchHistoricalRates = useCallback(
    async (params) => {
      if (!isAuthenticated) {
        console.warn(
          "Attempted to fetch historical rates while not authenticated"
        );
        return {};
      }

      setLoading(true);
      setError(null);
      try {
        const response = await getHistoricalRates(params);
        setHistoricalRates(response.data);
        return response.data;
      } catch (err) {
        setError(err);
        console.error("Error fetching historical rates:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  const fetchTrends = useCallback(
    async (params) => {
      if (!isAuthenticated) {
        console.warn(
          "Attempted to fetch currency trends while not authenticated"
        );
        return [];
      }

      setLoading(true);
      setError(null);
      try {
        const response = await getCurrencyTrends(params);
        setTrends(response.data);
        return response.data;
      } catch (err) {
        setError(err);
        console.error("Error fetching currency trends:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  return {
    currentRates,
    historicalRates,
    trends,
    loading,
    error,
    fetchCurrentRates,
    fetchHistoricalRates,
    fetchTrends,
  };
};
