// pages/admin-payments.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/AuthContext';
import AdminLayout from '@/components/adminLayout';

export default function AdminPayments() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user?.role !== 'admin') {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || user?.role !== 'admin') return <p>Loading...</p>;

  return (
    <AdminLayout>
      <h2>Payments & Transactions</h2>
      <p>List or filter all payment records here.</p>
    </AdminLayout>
  );
}
