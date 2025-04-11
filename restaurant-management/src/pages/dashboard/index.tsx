import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useAuth } from '@/components/AuthContext';
import DashboardLayout from '@/components/dashboardLayout';
import styles from './dashboard-index.module.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export default function DashboardIndex() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'owner') {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user?.role === 'owner' && user.restaurant_id) {
      fetchAnalytics();
      fetchOrders();
      fetchMenuItems();
    }
  }, [loading, user]);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/analytics`, {
        withCredentials: true,
      });
      setAnalytics(res.data.analytics || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load analytics data.');
    }
  };

  const fetchOrders = async () => {
    if (!user?.restaurant_id) return;
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/orders?restaurant_id=${user.restaurant_id}`,
        { withCredentials: true }
      );
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMenuItems = async () => {
    if (!user?.restaurant_id) return;
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/menus/${user.restaurant_id}`,
        { withCredentials: true }
      );
      setMenuItems(res.data.menus || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateQRCode = () => {
    router.push(`/customers/${user!.restaurant_id}`);
  };

  if (loading || user?.role !== 'owner') return <p>Loading...</p>;

  return (
    <DashboardLayout>
      <div className={styles.dashboard}>
        <h1 className={styles.title}>Welcome to Your Restaurant Dashboard</h1>
        <p className={styles.subtitle}>
          Restaurant Name: {user?.restaurant?.restaurant_name || 'Not available'}
        </p>
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.grid}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Analytics</h2>
            {analytics.length > 0 ? (
              <div className={styles.cardGrid}>
                {analytics.map((item, index) => (
                  <div key={index} className={styles.card}>
                    <h3>{item.metric}</h3>
                    <p>{item.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noData}>No analytics data available.</p>
            )}
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Recent Orders</h2>
            {orders.length > 0 ? (
              <ul className={styles.list}>
                {orders.map((order) => (
                  <li key={order.id} className={styles.listItem}>
                    <span>Order #{order.id}</span>
                    <span>Status: {order.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.noData}>No recent orders.</p>
            )}
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Menu Items</h2>
            {menuItems.length > 0 ? (
              <div className={styles.menuItemsCarousel}>
                {menuItems.map((item) => (
                  <div key={item.id} className={styles.menuItemCard}>
                    <img
                      src={item.image_url || '/images/default-image.jpg'}
                      alt={item.name}
                      className={styles.menuItemImage}
                    />
                    <div className={styles.menuItemDetails}>
                      <h3>{item.name}</h3>
                      <p>${item.price}</p>
                      <p>{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noData}>No menu items found.</p>
            )}
          </section>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Generate QR Code</h2>
          <button onClick={handleGenerateQRCode} className={styles.generateQRButton}>
            Generate QR Code
          </button>
        </section>
      </div>
    </DashboardLayout>
  );
}
