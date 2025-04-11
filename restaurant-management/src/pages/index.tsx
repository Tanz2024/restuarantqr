import Head from 'next/head';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { Box, Typography, TextField, Button, Stack, useMediaQuery, IconButton, InputAdornment, Checkbox, FormControlLabel } from '@mui/material';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const authenticateUser = async (identifier: string, password: string): Promise<{ success: boolean; token?: string; message?: string }> => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: identifier, password }),
        credentials: 'include', // ✅ This is crucial
      }
    );
    
    const data = await res.json();

    if (!res.ok) {
      return { success: false, message: data.error || 'Login failed' };
    }

    return { success: true, token: data.token };
  } catch (err) {
    console.error('Login request error:', err);
    return { success: false, message: 'Network error. Please try again.' };
  }
};

export default function RestaurantLogin() {
  const isMobile = useMediaQuery('(max-width:768px)');
  const router = useRouter();
  const [identifier, setIdentifier] = useState(''); // Email or Restaurant ID
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const response = await authenticateUser(identifier, password);
    if (response.success && response.token) {
      toast.success('Logged in successfully!');
      // Save token in localStorage (or cookie) for future authenticated requests
      localStorage.setItem('token', response.token);
      router.push('/dashboard');
    } else {
      toast.error(response.message || 'Invalid credentials. Please try again.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <>
      <Head>
        <title>QUICKFIT | Login</title>
        <meta name="description" content="Login page for QUICKFIT Restaurant SaaS" />
        <link rel="icon" href="/images/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          height: '100vh',
          backgroundColor: '#fff',
          fontFamily: 'Roboto, sans-serif',
        }}
      >
        {/* Left Image Section */}
        <Box
          sx={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            minHeight: { xs: '40vh', md: '100vh' },
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              backgroundImage:
                'url(https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1350&q=80)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            aria-hidden="true"
          />
        </Box>

        {/* Right Content Section */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: { xs: 2, md: 4 },
            textAlign: 'center',
            boxShadow: { md: '-5px 0 15px rgba(0, 0, 0, 0.1)' },
          }}
        >
          {/* Logo and Brand */}
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                overflow: 'hidden',
              }}
            >
              <Image src="/images/logo.png" alt="QUICKFIT Logo" width={80} height={80} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              QUICKFIT
            </Typography>
          </Stack>

          <Typography variant="body1" sx={{ mb: 1 }}>
            You are connecting to <strong>QUICKFIT</strong>
          </Typography>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
            Sign in with your QUICKFIT account
          </Typography>

          {/* Login Form */}
          <Box component="form" onSubmit={handleLogin} sx={{ width: '100%', maxWidth: 400, mb: 2 }}>
            <Stack spacing={2}>
              <TextField
                label="Email Address OR Restaurant ID"
                variant="outlined"
                fullWidth
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={togglePasswordVisibility} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    color="primary"
                  />
                }
                label="Remember me"
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  py: 1.5,
                  backgroundColor: '#0070f3',
                  '&:hover': { backgroundColor: '#005bb5' },
                  transition: 'background-color 0.3s ease, transform 0.2s ease',
                }}
              >
                Login
              </Button>
            </Stack>
          </Box>

          {/* Forgot Password Link */}
          <Box sx={{ width: '100%', maxWidth: 400, textAlign: 'right', mb: 2 }}>
            <Link legacyBehavior href="/forgot-password">
              <a style={{ color: '#0070f3', textDecoration: 'underline' }}>Forgot Password?</a>
            </Link>
          </Box>

          {/* Register Link */}
          <Box sx={{ width: '100%', maxWidth: 400, textAlign: 'center', mb: 2 }}>
            <Typography variant="body2">
              Don’t have an account?{' '}
              <Link legacyBehavior href="/register">
                <a style={{ color: '#0070f3', textDecoration: 'underline' }}>Register here</a>
              </Link>
            </Typography>
          </Box>

          {/* Admin Login Link */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              Are you an admin?{' '}
              <Link legacyBehavior href="/login">
                <a style={{ color: '#f50057', textDecoration: 'underline' }}>Click here</a>
              </Link>
            </Typography>
          </Box>

          {/* Info Message */}
          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <Typography variant="body2" color="textSecondary">
              Secure login required for all users. Please register to gain access to your personalized dashboard.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, textAlign: 'center', backgroundColor: '#f8f8f8' }}>
        <Typography variant="caption" color="textSecondary">
          © 2025 QUICKFIT Inc. All rights reserved.
        </Typography>
      </Box>

      <Toaster position="top-right" />
    </>
  );
}
