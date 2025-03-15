import { useState, useCallback } from "react";
import {
  getProfitLoss,
  getTransactionStats,
  getCurrencyPerformance,
  getOpportunities,
} from "../api/analytics";
import { useAuth } from "./useAuth"; // Add this import

export const useAnalytics = () => {
  const { isAuthenticated } = useAuth(); // Get authentication state
  const [profitLoss, setProfitLoss] = useState(null);
  const [transactionStats, setTransactionStats] = useState(null);
  const [currencyPerformance, setCurrencyPerformance] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfitLoss = useCallback(
    async (params = {}) => {
      if (!isAuthenticated) {
        console.warn(
          "Attempted to fetch profit/loss analytics while not authenticated"
        );
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await getProfitLoss(params);
        setProfitLoss(response.data);
        return response.data;
      } catch (err) {
        setError(err);
        console.error("Error fetching profit/loss data:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  const fetchTransactionStats = useCallback(
    async (params = {}) => {
      if (!isAuthenticated) {
        console.warn(
          "Attempted to fetch transaction stats while not authenticated"
        );
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await getTransactionStats(params);
        setTransactionStats(response.data);
        return response.data;
      } catch (err) {
        setError(err);
        console.error("Error fetching transaction statistics:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  const fetchCurrencyPerformance = useCallback(
    async (params = {}) => {
      if (!isAuthenticated) {
        console.warn(
          "Attempted to fetch currency performance while not authenticated"
        );
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await getCurrencyPerformance(params);
        setCurrencyPerformance(response.data);
        return response.data;
      } catch (err) {
        setError(err);
        console.error("Error fetching currency performance:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  const fetchOpportunities = useCallback(async () => {
    if (!isAuthenticated) {
      console.warn("Attempted to fetch opportunities while not authenticated");
      return [];
    }

    setLoading(true);
    setError(null);
    try {
      const response = await getOpportunities();
      setOpportunities(response.data);
      return response.data;
    } catch (err) {
      setError(err);
      console.error("Error fetching opportunities:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  return {
    profitLoss,
    transactionStats,
    currencyPerformance,
    opportunities,
    loading,
    error,
    fetchProfitLoss,
    fetchTransactionStats,
    fetchCurrencyPerformance,
    fetchOpportunities,
  };
};
