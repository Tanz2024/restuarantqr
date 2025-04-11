// OrderCard.tsx
import React from 'react';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderCardProps {
  orderId: string;
  tableNumber: number;
  items: OrderItem[];
  status?: string;
}

export default function OrderCard({ orderId, tableNumber, items, status }: OrderCardProps) {
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div style={{ border: '1px solid #ccc', margin: '0.5rem', padding: '1rem' }}>
      <h3>Order #{orderId}</h3>
      <p>Table: {tableNumber}</p>
      <ul>
        {items.map((item, idx) => (
          <li key={idx}>
            {item.quantity} x {item.name} = ${(item.quantity * item.price).toFixed(2)}
          </li>
        ))}
      </ul>
      <p><strong>Status:</strong> {status}</p>
      <p><strong>Total:</strong> ${total.toFixed(2)}</p>
    </div>
  );
}
