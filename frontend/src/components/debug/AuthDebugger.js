import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  Typography, 
  Button, 
  Divider, 
  List, 
  ListItem, 
  ListItemText,
  TextField,
  Alert
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

const AuthDebugger = () => {
  const { login, register } = useAuth();
  const [authStatus, setAuthStatus] = useState({});
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('password123');
  const [testResult, setTestResult] = useState(null);
  const [manualToken, setManualToken] = useState('');
  
  // Get stored tokens
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || 'Not found';
    const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken') || 'Not found';
    
    setAuthStatus({
      token: token.slice(0, 20) + '...',
      refreshToken: refreshToken.slice(0, 20) + '...',
      tokenLength: token !== 'Not found' ? token.length : 0,
      refreshTokenLength: refreshToken !== 'Not found' ? refreshToken.length : 0,
      storedIn: localStorage.getItem('token') ? 'localStorage' : 
                sessionStorage.getItem('token') ? 'sessionStorage' : 'Not stored',
    });
  }, [testResult]);
  
  // Test API with current token
  const testAuthAPI = async () => {
    try {
      // Attempt to make an authenticated request
      const response = await axios.get('/api/v1/auth/verify');
      setTestResult({
        success: true,
        status: response.status,
        data: response.data
      });
    } catch (error) {
      setTestResult({
        success: false,
        status: error.response?.status || 'Network Error',
        error: error.response?.data || error.message
      });
    }
  };
  
  // Test login
  const testLogin = async () => {
    try {
      await login(testEmail, testPassword);
      setTestResult({
        success: true,
        message: 'Login successful'
      });
    } catch (error) {
      setTestResult({
        success: false,
        status: error.response?.status || 'Network Error',
        error: error.response?.data || error.message
      });
    }
  };

  // Test API headers
  const checkHeaders = () => {
    const headers = axios.defaults.headers.common;
    setTestResult({
      success: true,
      headers: JSON.stringify(headers, null, 2)
    });
  };
  
  // Set manual token
  const setToken = () => {
    if (manualToken) {
      localStorage.setItem('token', manualToken);
      // Update axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${manualToken}`;
      setTestResult({
        success: true,
        message: 'Token manually set'
      });
      
      // Refresh status
      const token = localStorage.getItem('token') || 'Not found';
      setAuthStatus(prev => ({
        ...prev,
        token: token.slice(0, 20) + '...',
        tokenLength: token !== 'Not found' ? token.length : 0,
        storedIn: 'localStorage',
      }));
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Authentication Debugger
      </Typography>
      
      <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Current Auth Status
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText 
              primary="Authentication Token" 
              secondary={authStatus.token} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Token Length" 
              secondary={authStatus.tokenLength || 0} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Refresh Token" 
              secondary={authStatus.refreshToken} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Stored In" 
              secondary={authStatus.storedIn} 
            />
          </ListItem>
        </List>
      </Card>
      
      <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Test Authentication
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Test Email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Test Password"
            value={testPassword}
            onChange={(e) => setTestPassword(e.target.value)}
            type="password"
            fullWidth
            margin="normal"
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button variant="contained" onClick={testLogin}>
            Test Login
          </Button>
          <Button variant="outlined" onClick={testAuthAPI}>
            Test Auth API
          </Button>
          <Button variant="outlined" onClick={checkHeaders}>
            Check Headers
          </Button>
        </Box>
      </Card>
      
      <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Manual Token Control
        </Typography>
        
        <TextField
          label="JWT Token"
          value={manualToken}
          onChange={(e) => setManualToken(e.target.value)}
          fullWidth
          margin="normal"
        />
        
        <Button variant="contained" onClick={setToken} sx={{ mt: 1 }}>
          Set Token Manually
        </Button>
      </Card>
      
      {testResult && (
        <Card variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Test Result
          </Typography>
          
          <Alert severity={testResult.success ? "success" : "error"} sx={{ mb: 2 }}>
            {testResult.success ? "Success" : "Failed"} - Status: {testResult.status}
          </Alert>
          
          <Box 
            sx={{ 
              p: 2, 
              backgroundColor: '#f5f5f5', 
              borderRadius: 1,
              overflowX: 'auto'
            }}
          >
            <pre>
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </Box>
        </Card>
      )}
    </Box>
  );
};

export default AuthDebugger;