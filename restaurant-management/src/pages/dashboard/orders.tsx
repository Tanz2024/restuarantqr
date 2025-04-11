import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './dashboard-menu.module.css';
import DashboardLayout from '@/components/dashboardLayout';
import { useAuth } from '@/components/AuthContext';

const OrderPage = ({ orderId }: { orderId: string }) => {
  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState<string>('Pending');
  const [priority, setPriority] = useState<string>('Normal');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user, token } = useAuth(); // Using the AuthContext to access user and token

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        if (!user || !token) {
          // If no user or token, prompt for login or redirect
          console.log('User not authenticated');
          return;
        }

        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`, // Send token for authentication
          },
        });
        setOrder(response.data.order[0]);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching order details:', error);
      }
    };
    fetchOrderDetails();
  }, [orderId, user, token]); // Ensure it depends on user and token as well

  const handleStatusChange = async () => {
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/${orderId}/status`, { status, priority }, {
        headers: {
          Authorization: `Bearer ${token}`, // Send token for authentication
        },
      });
      alert('Order status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update order status');
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <DashboardLayout>
      <div className={styles.orderDetails}>
        <h2>Order Details</h2>
        <div className={styles.orderInfo}>
          <p><strong>Table Number:</strong> {order.table_number}</p>
          <p><strong>Customer Name:</strong> {order.customer_name}</p>
          <p><strong>Contact:</strong> {order.customer_contact}</p>
          <p><strong>Created At:</strong> {new Date(order.created_at).toLocaleString()}</p>
          <p><strong>Status:</strong> {order.status}</p>
          <p><strong>Priority:</strong> {order.priority}</p>
        </div>

        <h3>Items</h3>
        <ul className={styles.itemList}>
          {order.item_name.map((item: string, index: number) => (
            <li key={index} className={styles.item}>
              <p><strong>{item}</strong> - Quantity: {order.quantity[index]} - Price: ${order.price[index]}</p>
              <p><strong>Special Requests:</strong> {order.special_requests}</p>
            </li>
          ))}
        </ul>

        <div className={styles.statusUpdate}>
          <h4>Update Order Status</h4>
          <label>Status:</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <br />
          <label>Priority:</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
          </select>
          <br />
          <button onClick={handleStatusChange}>Update Status</button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrderPage;
