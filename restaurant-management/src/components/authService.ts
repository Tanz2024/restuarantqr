import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'owner';
  restaurant_id?: string; // Added property for restaurant id
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  restaurant?: { id: string; [key: string]: any }; // Adjust type as needed
}

export async function registerOwner(
  name: string,
  email: string,
  password: string,
  plan: string,
  address: string,
  phone: string,
  openingHours: string,
  closingHours: string,
  description: string,
  region: string
): Promise<AuthResponse> {
  try {
    const response = await axios.post(`${API_BASE}/api/auth/register`, {
      name,
      email,
      password,
      plan,
      address,
      phone,
      openingHours,
      closingHours,
      description,
      region
    });
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const backendMsg = error.response?.data?.error || error.response?.data?.message;
      throw new Error(backendMsg || 'Registration failed. Please try again.');
    }
    throw new Error('An unexpected error occurred during registration.');
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const response = await axios.post(`${API_BASE}/api/auth/login`, {
      email,
      password,
    });
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new Error('Invalid credentials. Please check your email and password.');
    }
    throw new Error(error.response?.data?.error || 'An unexpected error occurred.');
  }
}
