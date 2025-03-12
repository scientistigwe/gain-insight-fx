import { useState, useEffect, useCallback } from "react";
import {
  getUserTransactions,
  createTransaction,
  deleteTransaction,
} from "../api/transactions";

export const useTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getUserTransactions();
      setTransactions(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(err.response?.data?.detail || "Failed to load transactions");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = async (transactionData) => {
    try {
      const response = await createTransaction(transactionData);
      setTransactions([response.data, ...transactions]);
      return response.data;
    } catch (err) {
      console.error("Error creating transaction:", err);
      throw err;
    }
  };

  const removeTransaction = async (id) => {
    try {
      await deleteTransaction(id);
      setTransactions(
        transactions.filter((transaction) => transaction.id !== id)
      );
      return true;
    } catch (err) {
      console.error("Error deleting transaction:", err);
      throw err;
    }
  };

  // Calculate totals by currency
  const getTotalsByCurrency = () => {
    const totals = {};

    transactions.forEach((transaction) => {
      // From currency
      const fromCurrency = transaction.from_currency.code;
      if (!totals[fromCurrency]) {
        totals[fromCurrency] = {
          outgoing: 0,
          incoming: 0,
        };
      }
      totals[fromCurrency].outgoing += transaction.from_amount;

      // To currency
      const toCurrency = transaction.to_currency.code;
      if (!totals[toCurrency]) {
        totals[toCurrency] = {
          outgoing: 0,
          incoming: 0,
        };
      }
      totals[toCurrency].incoming += transaction.to_amount;
    });

    return totals;
  };

  // Get unique currencies from transactions
  const getUniqueCurrencies = () => {
    const currencies = new Set();

    transactions.forEach((transaction) => {
      currencies.add(transaction.from_currency.code);
      currencies.add(transaction.to_currency.code);
    });

    return Array.from(currencies).sort();
  };

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    addTransaction,
    removeTransaction,
    getTotalsByCurrency,
    getUniqueCurrencies,
  };
};
