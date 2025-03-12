import React, { createContext, useState, useEffect } from "react";
import {
  getUserAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
} from "../api/alerts";

export const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await getUserAlerts();
      setAlerts(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setError("Failed to load alerts. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch alerts on mount
  useEffect(() => {
    fetchAlerts();
  }, []);

  const addAlert = async (alertData) => {
    try {
      const response = await createAlert(alertData);
      setAlerts([...alerts, response.data]);
      return response.data;
    } catch (err) {
      console.error("Error creating alert:", err);
      throw err;
    }
  };

  const modifyAlert = async (id, alertData) => {
    try {
      const response = await updateAlert(id, alertData);
      setAlerts(
        alerts.map((alert) => (alert.id === id ? response.data : alert))
      );
      return response.data;
    } catch (err) {
      console.error("Error updating alert:", err);
      throw err;
    }
  };

  const removeAlert = async (id) => {
    try {
      await deleteAlert(id);
      setAlerts(alerts.filter((alert) => alert.id !== id));
      return true;
    } catch (err) {
      console.error("Error deleting alert:", err);
      throw err;
    }
  };

  return (
    <AlertContext.Provider
      value={{
        alerts,
        loading,
        error,
        fetchAlerts,
        addAlert,
        modifyAlert,
        removeAlert,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};
