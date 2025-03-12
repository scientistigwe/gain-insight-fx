import apiClient from "./client";

export const getUsers = (skip = 0, limit = 100) => {
  return apiClient.get(`/admin/users?skip=${skip}&limit=${limit}`);
};

export const createUser = (userData) => {
  return apiClient.post("/admin/users", userData);
};

export const updateUser = (id, userData) => {
  return apiClient.put(`/admin/users/${id}`, userData);
};

export const deleteUser = (id) => {
  return apiClient.delete(`/admin/users/${id}`);
};

export const getAuditLogs = (options = {}) => {
  const { skip = 0, limit = 100, userId, action, entityType } = options;
  let url = `/admin/audit-logs?skip=${skip}&limit=${limit}`;

  if (userId) url += `&user_id=${userId}`;
  if (action) url += `&action=${action}`;
  if (entityType) url += `&entity_type=${entityType}`;

  return apiClient.get(url);
};
