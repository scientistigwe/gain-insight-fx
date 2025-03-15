import { useState, useCallback } from "react";
import {
  getCurrentUser,
  updateUserProfile,
  updateUserPassword,
  getUserWallets,
} from "../api/users";
import { useAuth } from "./useAuth"; // Add this import

export const useUser = () => {
  const { isAuthenticated } = useAuth(); // Get authentication state
  const [profile, setProfile] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) {
      console.warn("Attempted to fetch user profile while not authenticated");
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await getCurrentUser();
      setProfile(response.data);
      return response.data;
    } catch (err) {
      setError(err);
      console.error("Error fetching user profile:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const updateProfile = useCallback(
    async (profileData) => {
      if (!isAuthenticated) {
        console.warn(
          "Attempted to update user profile while not authenticated"
        );
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await updateUserProfile(profileData);
        setProfile(response.data);
        return response.data;
      } catch (err) {
        setError(err);
        console.error("Error updating user profile:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  const updatePassword = useCallback(
    async (passwordData) => {
      if (!isAuthenticated) {
        console.warn("Attempted to update password while not authenticated");
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await updateUserPassword(passwordData);
        return response.data;
      } catch (err) {
        setError(err);
        console.error("Error updating password:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  const fetchWallets = useCallback(async () => {
    if (!isAuthenticated) {
      console.warn("Attempted to fetch user wallets while not authenticated");
      return [];
    }

    setLoading(true);
    setError(null);
    try {
      const response = await getUserWallets();
      setWallets(response.data);
      return response.data;
    } catch (err) {
      setError(err);
      console.error("Error fetching user wallets:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  return {
    profile,
    wallets,
    loading,
    error,
    fetchProfile,
    updateProfile,
    updatePassword,
    fetchWallets,
  };
};
