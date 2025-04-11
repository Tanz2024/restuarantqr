import type { AppProps } from 'next/app';
import { AuthProvider } from '@/components/AuthContext';
import Footer from '@/components/Footer';
import { useRouter } from 'next/router';
import '../globals.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Extract the path
  const path = router.asPath;

  // Hide footer on:
  // - /customers/details
  // - /customers/menus/[menuId]
  const hideFooter =
    path === '/customers/details' ||
    /^\/customers\/menus\/[^\/]+$/.test(path);

  return (
    <AuthProvider>
      <Component {...pageProps} />
      {!hideFooter && <Footer type="platform" />}
    </AuthProvider>
  );
}
