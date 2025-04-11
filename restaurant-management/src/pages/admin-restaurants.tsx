// pages/admin-restaurants.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/AuthContext';
import AdminLayout from '@/components/adminLayout';
// import { fetchAllRestaurants } from '@/components/restaurantService'; // Example

export default function AdminRestaurants() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [restaurants, setRestaurants] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && user?.role !== 'admin') {
      router.push('/login');
    } else {
      // fetchAllRestaurants().then(setRestaurants).catch(console.error);
      // For now, placeholder:
      setRestaurants([{ id: '1', name: 'Pizza Hub', plan: 'Pro' }]);
    }
  }, [user, loading, router]);

  if (loading || user?.role !== 'admin') return <p>Loading...</p>;

  return (
    <AdminLayout>
      <h2>All Registered Restaurants</h2>
      <ul>
        {restaurants.map((r) => (
          <li key={r.id}>
            {r.name} - Plan: {r.plan}
          </li>
        ))}
      </ul>
    </AdminLayout>
  );
}
