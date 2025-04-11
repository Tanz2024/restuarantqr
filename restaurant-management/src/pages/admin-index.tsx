// pages/adminIndex.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import DashboardLayout from '@/components/dashboardLayout'; // or use adminLayout if separate
import styles from './adminIndex.module.css';

export default function AdminIndex() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  // Fetch all restaurants
  const fetchRestaurants = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/restaurants`);
      setRestaurants(res.data.restaurants || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load restaurants.');
    }
  };

  // Fetch subscriptions
  const fetchSubscriptions = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/subscriptions`);
      setSubscriptions(res.data.subscriptions || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch payments summary (assumed endpoint)
  const fetchPayments = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/payments`);
      setPayments(res.data.payments || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    fetchSubscriptions();
    fetchPayments();
  }, []);

  return (
    <DashboardLayout>
      <div className={styles.dashboard}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        {error && <p className={styles.error}>{error}</p>}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Restaurants</h2>
          {restaurants.length > 0 ? (
            <ul className={styles.list}>
              {restaurants.map(rest => (
                <li key={rest.id} className={styles.listItem}>
                  <span>{rest.name}</span>
                  <span>{rest.email}</span>
                  <span>{rest.plan}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.noData}>No restaurants available.</p>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Subscriptions</h2>
          {subscriptions.length > 0 ? (
            <ul className={styles.list}>
              {subscriptions.map(sub => (
                <li key={sub.id} className={styles.listItem}>
                  <span>{sub.name}</span>
                  <span>{sub.price}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.noData}>No active subscriptions.</p>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Payments</h2>
          {payments.length > 0 ? (
            <ul className={styles.list}>
              {payments.map(pay => (
                <li key={pay.id} className={styles.listItem}>
                  <span>{pay.provider}</span>
                  <span>${pay.amount}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.noData}>No payment records available.</p>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
