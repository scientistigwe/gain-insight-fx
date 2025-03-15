import { useState, useCallback } from "react";
import {
  getUserTransactions,
  getTransaction,
  createTransaction,
  deleteTransaction,
  getWallets,
} from "../api/transactions";
import { useAuth } from "./useAuth"; // Add this import

export const useTransactions = () => {
  const { isAuthenticated } = useAuth(); // Get authentication state
  const [transactions, setTransactions] = useState([]);
  const [transaction, setTransaction] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(
    async (params = {}) => {
      if (!isAuthenticated) {
        console.warn("Attempted to fetch transactions while not authenticated");
        return [];
      }

      setLoading(true);
      setError(null);
      try {
        const response = await getUserTransactions(params);
        setTransactions(response.data);
        return response.data;
      } catch (err) {
        setError(err);
        console.error("Error fetching transactions:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  const fetchTransaction = useCallback(
    async (id) => {
      if (!isAuthenticated) {
        console.warn(
          "Attempted to fetch transaction details while not authenticated"
        );
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await getTransaction(id);
        setTransaction(response.data);
        return response.data;
      } catch (err) {
        setError(err);
        console.error(`Error fetching transaction ${id}:`, err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  const addTransaction = useCallback(
    async (data) => {
      if (!isAuthenticated) {
        console.warn("Attempted to create transaction while not authenticated");
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await createTransaction(data);
        setTransactions((prev) => [...prev, response.data]);
        return response.data;
      } catch (err) {
        setError(err);
        console.error("Error creating transaction:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  const removeTransaction = useCallback(
    async (id) => {
      if (!isAuthenticated) {
        console.warn("Attempted to remove transaction while not authenticated");
        return false;
      }

      setLoading(true);
      setError(null);
      try {
        await deleteTransaction(id);
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        return true;
      } catch (err) {
        setError(err);
        console.error(`Error deleting transaction ${id}:`, err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  const fetchWallets = useCallback(async () => {
    if (!isAuthenticated) {
      console.warn("Attempted to fetch wallets while not authenticated");
      return [];
    }

    setLoading(true);
    setError(null);
    try {
      const response = await getWallets();
      setWallets(response.data);
      return response.data;
    } catch (err) {
      setError(err);
      console.error("Error fetching wallets:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  return {
    transactions,
    transaction,
    wallets,
    loading,
    error,
    fetchTransactions,
    fetchTransaction,
    addTransaction,
    removeTransaction,
    fetchWallets,
  };
};
