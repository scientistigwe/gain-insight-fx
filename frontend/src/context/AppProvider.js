import React, { createContext, useContext } from "react";

// Import all original hooks
import { useAuth as useOriginalAuth, AuthProvider } from "../hooks/useAuth";
import { useCurrency as useOriginalCurrency } from "../hooks/useCurrency";
import { useAlerts as useOriginalAlerts } from "../hooks/useAlerts";
import { useAdmin as useOriginalAdmin } from "../hooks/useAdmin";
import { useAnalytics as useOriginalAnalytics } from "../hooks/useAnalytics";
import { useTransactions as useOriginalTransactions } from "../hooks/useTransactions";
import { useUser as useOriginalUser } from "../hooks/useUser";

// Create contexts for each domain
export const AuthContext = createContext(null);
export const CurrencyContext = createContext(null);
export const AlertsContext = createContext(null);
export const AdminContext = createContext(null);
export const AnalyticsContext = createContext(null);
export const TransactionsContext = createContext(null);
export const UserContext = createContext(null);

// Create a Higher-Order Component wrapper for context providers
const withProvider = (Context, value, children) => (
  <Context.Provider value={value}>{children}</Context.Provider>
);

// Main AppProvider component
export const AppProvider = ({ children }) => {
  // We don't instantiate the auth hook here - see below

  return (
    <AuthProvider>
      <InnerAppProvider>{children}</InnerAppProvider>
    </AuthProvider>
  );
};

// Inner provider that depends on AuthProvider being available
const InnerAppProvider = ({ children }) => {
  // Now we can safely use all hooks that depend on auth
  const auth = useOriginalAuth();
  const currency = useOriginalCurrency();
  const alerts = useOriginalAlerts();
  const admin = useOriginalAdmin();
  const analytics = useOriginalAnalytics();
  const transactions = useOriginalTransactions();
  const user = useOriginalUser();

  // Nest all providers
  return withProvider(
    AuthContext,
    auth,
    withProvider(
      CurrencyContext,
      currency,
      withProvider(
        AlertsContext,
        alerts,
        withProvider(
          AdminContext,
          admin,
          withProvider(
            AnalyticsContext,
            analytics,
            withProvider(
              TransactionsContext,
              transactions,
              withProvider(UserContext, user, children)
            )
          )
        )
      )
    )
  );
};

// Export custom hooks for components to use
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AppProvider");
  }
  return context;
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within an AppProvider");
  }
  return context;
};

export const useAlerts = () => {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error("useAlerts must be used within an AppProvider");
  }
  return context;
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AppProvider");
  }
  return context;
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within an AppProvider");
  }
  return context;
};

export const useTransactions = () => {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error("useTransactions must be used within an AppProvider");
  }
  return context;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within an AppProvider");
  }
  return context;
};
