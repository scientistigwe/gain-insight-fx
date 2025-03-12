import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import { getAuditLogs } from '../../api/admin';
import { formatDateTime } from '../../utils/formatters';

const AdminAuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    entityType: ''
  });

  // Fetch audit logs with filters
  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const options = {
        skip: page * rowsPerPage,
        limit: rowsPerPage,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      };
      
      const response = await getAuditLogs(options);
      setAuditLogs(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Failed to load audit logs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch audit logs on mount and when filters or pagination changes
  useEffect(() => {
    fetchAuditLogs();
  }, [page, rowsPerPage]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    setPage(0); // Reset to first page
    fetchAuditLogs();
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      userId: '',
      action: '',
      entityType: ''
    });
    setPage(0);
    fetchAuditLogs();
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get color for different actions
  const getActionColor = (action) => {
    switch (action) {
      case 'create':
        return 'success';
      case 'update':
        return 'info';
      case 'delete':
        return 'error';
      case 'login':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Audit Logs
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Filters */}
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="User ID"
                name="userId"
                value={filters.userId}
                onChange={handleFilterChange}
                variant="outlined"
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Action</InputLabel>
                <Select
                  name="action"
                  value={filters.action}
                  onChange={handleFilterChange}
                  label="Action"
                >
                  <MenuItem value="">All Actions</MenuItem>
                  <MenuItem value="create">Create</MenuItem>
                  <MenuItem value="update">Update</MenuItem>
                  <MenuItem value="delete">Delete</MenuItem>
                  <MenuItem value="login">Login</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Entity Type</InputLabel>
                <Select
                  name="entityType"
                  value={filters.entityType}
                  onChange={handleFilterChange}
                  label="Entity Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="transaction">Transaction</MenuItem>
                  <MenuItem value="alert">Alert</MenuItem>
                  <MenuItem value="profile">Profile</MenuItem>
                  <MenuItem value="password">Password</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleApplyFilters}
                sx={{ mr: 1 }}
              >
                Apply
              </Button>
              <Button
                variant="outlined"
                onClick={handleResetFilters}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Paper variant="outlined">
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : auditLogs.length > 0 ? (
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>User ID</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Entity Type</TableCell>
                  <TableCell>Entity ID</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>IP Address</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>{formatDateTime(log.created_at)}</TableCell>
                    <TableCell>{log.user_id || 'System'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={log.action} 
                        size="small" 
                        color={getActionColor(log.action)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{log.entity_type}</TableCell>
                    <TableCell>{log.entity_id || '-'}</TableCell>
                    <TableCell>
                      {log.details ? (
                        <pre style={{ margin: 0, maxWidth: '200px', overflow: 'auto' }}>
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{log.ip_address || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No audit logs found.
              </Typography>
            </Box>
          )}
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={-1} // We don't know the total count, pagination is handled server-side
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Container>
  );
};

export default AdminAuditLogs;