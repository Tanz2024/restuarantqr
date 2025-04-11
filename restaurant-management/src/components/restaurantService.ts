// restaurantService.ts
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export async function getQRCode(restaurantId: string): Promise<string> {
  // Returns base64 data URL of the QR code
  const res = await axios.get(`${API_BASE}/api/restaurants/${restaurantId}/qrcode`);
  return res.data.qrImage;
}

export async function fetchSubscriptions() {
  const res = await axios.get(`${API_BASE}/api/subscriptions`);
  return res.data.subscriptions;
}

export async function fetchPlanFeatures(plan: string) {
  const res = await axios.get(`${API_BASE}/api/plan_features/${plan}`);
  return res.data.features;
}
