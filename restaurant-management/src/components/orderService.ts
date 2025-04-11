// orderService.ts
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

interface OrderItemData {
  menu_id?: string;
  name: string;
  quantity: number;
  price: number;
}

export async function placeOrder(
  restaurant_id: string,
  table_number: number,
  items: OrderItemData[]
) {
  const res = await axios.post(`${API_BASE}/api/orders`, {
    restaurant_id,
    table_number,
    items,
  });
  return res.data;
}
