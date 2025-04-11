import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/AuthContext';
import { Toaster, toast } from 'react-hot-toast';

// MUI Components
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  CircularProgress
} from '@mui/material';

// MUI Icons
import { Visibility, VisibilityOff } from '@mui/icons-material';

// Next Image for the logo
import Image from 'next/image';

interface LoginResponse {
  user: {
    role: string;
    [key: string]: any;
  };
  token: string;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await login(email, password);
      if (
        response &&
        typeof response === 'object' &&
        'token' in response &&
        typeof response.token === 'string'
      ) {
        const { user, token } = response as unknown as LoginResponse;
        
        // Check if the user is an admin
        if (user.role !== 'admin') {
          toast.error('Unauthorized: Only admins can log in here.');
          setLoading(false);
          return;
        }
        
        // Store token based on "Remember me" selection
        if (rememberMe) {
          localStorage.setItem('authToken', token);
        } else {
          sessionStorage.setItem('authToken', token);
        }
        
        // Redirect to admin dashboard
        router.push('/admin');
      } else {
        toast.error('Invalid login response.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f5f5f5'
      }}
    >
      {/* Header */}
      <Box
        component="header"
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 2
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              overflow: 'hidden',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Image src="/images/logo.png" alt="QUICKFIT Logo" width={80} height={80} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            QUICKFIT
          </Typography>
        </Stack>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          px: { xs: 1, sm: 2 }
        }}
      >
        <Card
          sx={{
            maxWidth: 400,
            width: '100%',
            mx: 2,
            p: 3,
            boxShadow: 6,
            borderRadius: 3,
            transition: 'box-shadow 0.3s ease',
            '&:hover': { boxShadow: 10 }
          }}
        >
          <CardContent>
            <Typography
              variant="h5"
              component="h1"
              sx={{ mb: 2, textAlign: 'center', fontWeight: 600 }}
            >
              Admin Login
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              {/* Email Field */}
              <TextField
                label="Email"
                variant="outlined"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email"
              />

              {/* Password Field */}
              <TextField
                label="Password"
                variant="outlined"
                fullWidth
                margin="normal"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="Password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              {/* Instruction for Forgot Password */}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1, textAlign: 'center' }}>
                For password assistance, please contact technical support.
              </Typography>

              {/* Remember Me */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    sx={{ color: 'primary.main' }}
                    inputProps={{ 'aria-label': 'Remember me' }}
                  />
                }
                label="Remember me"
                sx={{ mt: 1 }}
              />

              {/* Buttons: Back and Login */}
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => router.back()}
                  sx={{
                    borderColor: '#0070f3',
                    color: '#0070f3',
                    ':hover': { borderColor: '#0051a3', color: '#0051a3' },
                    height: '3rem'
                  }}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  sx={{
                    backgroundColor: '#0070f3',
                    ':hover': { backgroundColor: '#0051a3' },
                    height: '3rem'
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          textAlign: 'center',
          py: 2,
          mt: 2
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © 2025 QUICKFIT Inc. All rights reserved.
        </Typography>
      </Box>

      <Toaster position="top-right" />
    </Box>
  );
}
