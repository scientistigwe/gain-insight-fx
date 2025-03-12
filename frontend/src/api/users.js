import apiClient from './client';

export const getCurrentUser = () => {
  return apiClient.get('/users/me');
};

export const updateUserProfile = (profileData) => {
  return apiClient.put('/users/me/profile', profileData);
};

export const updateUserPassword = (passwordData) => {
  return apiClient.put('/users/me/password', passwordData);
};

export const getUserWallets = () => {
  return apiClient.get('/users/me/wallets');
};