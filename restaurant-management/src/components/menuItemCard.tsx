// MenuItemCard.tsx
import React from 'react';

interface MenuItemCardProps {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  onAdd?: () => void;
}

export default function MenuItemCard({
  id,
  name,
  price,
  description,
  imageUrl,
  onAdd,
}: MenuItemCardProps) {
  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', margin: '0.5rem' }}>
      {imageUrl && <img src={imageUrl} alt={name} style={{ maxWidth: '100%' }} />}
      <h3>{name}</h3>
      <p>Price: ${price.toFixed(2)}</p>
      {description && <p>{description}</p>}
      {onAdd && (
        <button onClick={onAdd} style={{ marginTop: '0.5rem' }}>
          Add to Order
        </button>
      )}
    </div>
  );
}
