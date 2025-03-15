import { useState, useCallback } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getAuditLogs,
} from "../api/admin";
import { useAuth } from "./useAuth"; // Add this import

export const useAdmin = () => {
  const { isAuthenticated } = useAuth(); // Get authentication state
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(
    async (params = {}) => {
      // Check authentication before making request
      if (!isAuthenticated) {
        console.warn("Attempted to fetch users while not authenticated");
        return [];
      }

      setLoading(true);
      setError(null);
      try {
        const response = await getUsers(params);
        setUsers(response.data);
        return response.data;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  ); // Add isAuthenticated to dependencies

  const addUser = useCallback(
    async (userData) => {
      if (!isAuthenticated) {
        console.warn("Attempted to add user while not authenticated");
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await createUser(userData);
        setUsers((prev) => [...prev, response.data]);
        return response.data;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  const editUser = useCallback(
    async (id, userData) => {
      if (!isAuthenticated) {
        console.warn("Attempted to edit user while not authenticated");
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await updateUser(id, userData);
        setUsers((prev) =>
          prev.map((user) => (user.id === id ? response.data : user))
        );
        return response.data;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  const removeUser = useCallback(
    async (id) => {
      if (!isAuthenticated) {
        console.warn("Attempted to remove user while not authenticated");
        return false;
      }

      setLoading(true);
      setError(null);
      try {
        await deleteUser(id);
        setUsers((prev) => prev.filter((user) => user.id !== id));
        return true;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  const fetchAuditLogs = useCallback(
    async (params = {}) => {
      if (!isAuthenticated) {
        console.warn("Attempted to fetch audit logs while not authenticated");
        return [];
      }

      setLoading(true);
      setError(null);
      try {
        const response = await getAuditLogs(params);
        setAuditLogs(response.data);
        return response.data;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  return {
    users,
    auditLogs,
    loading,
    error,
    fetchUsers,
    addUser,
    editUser,
    removeUser,
    fetchAuditLogs,
  };
};
