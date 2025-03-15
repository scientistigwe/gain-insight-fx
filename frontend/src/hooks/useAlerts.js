import { useState, useCallback } from 'react';
import { 
  getUserAlerts, 
  getAlert, 
  createAlert, 
  updateAlert, 
  deleteAlert 
} from '../api/alerts';
import { useAuth } from './useAuth'; // Add this import

export const useAlerts = () => {
  const { isAuthenticated } = useAuth(); // Get authentication state
  const [alerts, setAlerts] = useState([]);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAlerts = useCallback(async (params = {}) => {
    if (!isAuthenticated) {
      console.warn('Attempted to fetch alerts while not authenticated');
      return [];
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await getUserAlerts(params);
      setAlerts(response.data);
      return response.data;
    } catch (err) {
      setError(err);
      console.error('Error fetching alerts:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchAlert = useCallback(async (id) => {
    if (!isAuthenticated) {
      console.warn('Attempted to fetch alert details while not authenticated');
      return null;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await getAlert(id);
      setAlert(response.data);
      return response.data;
    } catch (err) {
      setError(err);
      console.error(`Error fetching alert ${id}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const addAlert = useCallback(async (data) => {
    if (!isAuthenticated) {
      console.warn('Attempted to create alert while not authenticated');
      return null;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await createAlert(data);
      setAlerts(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err);
      console.error('Error creating alert:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const editAlert = useCallback(async (id, data) => {
    if (!isAuthenticated) {
      console.warn('Attempted to edit alert while not authenticated');
      return null;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await updateAlert(id, data);
      setAlerts(prev => prev.map(a => a.id === id ? response.data : a));
      return response.data;
    } catch (err) {
      setError(err);
      console.error(`Error updating alert ${id}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const removeAlert = useCallback(async (id) => {
    if (!isAuthenticated) {
      console.warn('Attempted to remove alert while not authenticated');
      return false;
    }
    
    setLoading(true);
    setError(null);
    try {
      await deleteAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
      return true;
    } catch (err) {
      setError(err);
      console.error(`Error deleting alert ${id}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  return {
    alerts,
    alert,
    loading,
    error,
    fetchAlerts,
    fetchAlert,
    addAlert,
    editAlert,
    removeAlert
  };
};