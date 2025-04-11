import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import { Toaster, toast } from 'react-hot-toast';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  CircularProgress
} from '@mui/material';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE) {
      toast.error('API configuration error.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      // Always display a generic message (modern approach)
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success('If an account with that email exists, we’ve sent a reset link.');
        router.push('/login');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error sending reset link.');
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
              width: 60,
              height: 60,
              borderRadius: '50%',
              overflow: 'hidden',
              boxShadow: 2
            }}
          >
            <Image src="/images/logo.png" alt="QUICKFIT Logo" width={60} height={60} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
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
              Forgot Password
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
              Enter your email to receive a password reset link.
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                label="Email"
                variant="outlined"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email"
              />
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
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
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
