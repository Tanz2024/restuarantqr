import { Box, Typography, Link, Stack, Divider } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Image from 'next/image';

export default function Footer({ type = 'platform' }: { type?: 'platform' | 'restaurant' }) {
  const isRestaurant = type === 'restaurant';

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#f4f4f4',
        py: { xs: 2, sm: 3 },
        px: { xs: 2, sm: 4 },
        mt: 'auto',
        borderTop: '1px solid #e0e0e0',
        textAlign: 'center',
      }}
    >
      <Stack spacing={{ xs: 1, sm: 1.5 }} alignItems="center">
        <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>
          {isRestaurant
            ? 'Powered by QUICKFIT for this Restaurant'
            : 'QUICKFIT – Where tech meets tasty and orders are always served fresh!'}
        </Typography>

        <Divider sx={{ width: { xs: 60, sm: 80 }, borderColor: '#ccc' }} />

        {isRestaurant ? (
          <>
            <Stack direction="row" spacing={1} alignItems="center">
              <EmailIcon fontSize="small" sx={{ color: '#666' }} />
              <Typography variant="caption" color="textSecondary">
                <Link
                  href="mailto:owner@email.com"
                  underline="hover"
                  sx={{ '&:hover': { color: '#0070f3' } }}
                >
                  owner@email.com
                </Link>
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <PhoneIcon fontSize="small" sx={{ color: '#666' }} />
              <Typography variant="caption" color="textSecondary">
                +60 12-345 6789
              </Typography>
            </Stack>
          </>
        ) : (
          <>
            <Stack direction="row" spacing={1} alignItems="center">
              <EmailIcon fontSize="small" sx={{ color: '#666' }} />
              <Typography variant="caption" color="textSecondary">
                <Link
                  href="mailto:quickfit@gmail.com"
                  underline="hover"
                  sx={{ '&:hover': { color: '#0070f3' } }}
                >
                  quickfit@gmail.com
                </Link>
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <PhoneIcon fontSize="small" sx={{ color: '#666' }} />
              <Typography variant="caption" color="textSecondary">
                +60 12-345 6789
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <LocationOnIcon fontSize="small" sx={{ color: '#666' }} />
              <Typography variant="caption" color="textSecondary">
                Kuala Lumpur, Malaysia
              </Typography>
            </Stack>
          </>
        )}

        <Divider sx={{ width: { xs: 60, sm: 80 }, borderColor: '#ccc' }} />

        {/* Navigation Links */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1, sm: 2 }}
          alignItems="center"
        >
          <Link
            href="/terms"
            underline="hover"
            color="textSecondary"
            sx={{ fontSize: '0.75rem', '&:hover': { color: '#0070f3' } }}
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            underline="hover"
            color="textSecondary"
            sx={{ fontSize: '0.75rem', '&:hover': { color: '#0070f3' } }}
          >
            Privacy
          </Link>
          <Link
            href="/help"
            underline="hover"
            color="textSecondary"
            sx={{ fontSize: '0.75rem', '&:hover': { color: '#0070f3' } }}
          >
            Help
          </Link>
        </Stack>

        <Divider sx={{ width: { xs: 60, sm: 80 }, borderColor: '#ccc' }} />

        {/* Branding with Logo */}
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
          <Image
            src="/images/logo.png"
            alt="QUICKFIT Logo"
            width={20}
            height={20}
            style={{ objectFit: 'contain' }}
          />
          <Typography variant="caption" color="textSecondary">
            © {new Date().getFullYear()} QUICKFIT Inc. All rights reserved.
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
