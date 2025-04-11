// menuService.ts
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  image_url?: string;
  is_available?: boolean;
}

export async function createMenuItem(
  token: string,
  itemData: Omit<MenuItem, 'id'>
) {
  // itemData = { restaurant_id, name, description, price, ... }
  const res = await axios.post(`${API_BASE}/api/menus`, itemData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.menu;
}

export async function fetchMenuItems(restaurantId: string): Promise<MenuItem[]> {
  const res = await axios.get(`${API_BASE}/api/menus/${restaurantId}`);
  return res.data.menus;
}
