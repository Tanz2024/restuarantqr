// pages/admin-subscriptions.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/AuthContext';
import AdminLayout from '@/components/adminLayout';
import { fetchSubscriptions } from '@/components/restaurantService';

export default function AdminSubscriptions() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [subs, setSubs] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && user?.role !== 'admin') {
      router.push('/login');
    } else {
      fetchSubscriptions().then(setSubs).catch(console.error);
    }
  }, [user, loading, router]);

  if (loading || user?.role !== 'admin') return <p>Loading...</p>;

  return (
    <AdminLayout>
      <h2>Manage Subscription Plans</h2>
      <ul>
        {subs.map((s) => (
          <li key={s.id}>
            {s.name} - ${s.price} - {s.is_active ? 'Active' : 'Inactive'}
          </li>
        ))}
      </ul>
    </AdminLayout>
  );
}
