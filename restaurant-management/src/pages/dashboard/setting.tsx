import { useState, useEffect, ChangeEvent } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/dashboardLayout';
import { useAuth } from '@/components/AuthContext';
import styles from './settings.module.css';

interface RestaurantSettings {
  id: string;
  restaurant_name: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  opening_hours?: string;
  closing_hours?: string;
  description?: string;
  region?: string;
  plan?: string;
  qr_code_url?: string;
}

const Settings = () => {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [form, setForm] = useState({
    restaurantName: '',
    logoUrl: '',
    address: '',
    phone: '',
    opening_hours: '',
    closing_hours: '',
    description: '',
    region: '',
  });
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, refreshUser } = useAuth();

  // Fetch restaurant settings from the profile endpoint.
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/profile`,
          { withCredentials: true }
        );
        if (res.data.user && res.data.user.restaurant) {
          const restaurant = res.data.user.restaurant;
          setSettings(restaurant);
          setForm({
            restaurantName: restaurant.restaurant_name || '',
            logoUrl: restaurant.logo_url || '',
            address: restaurant.address || '',
            phone: restaurant.phone || '',
            opening_hours: restaurant.opening_hours || '',
            closing_hours: restaurant.closing_hours || '',
            description: restaurant.description || '',
            region: restaurant.region || '',
          });
        } else {
          setError('Restaurant details not found.');
        }
      } catch (err) {
        console.error('Settings fetch error:', err);
        setError('Failed to fetch settings.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // In production, upload the file and set the returned URL.
      setForm((prev) => ({ ...prev, logoUrl: URL.createObjectURL(file) }));
    }
  };

  const handleSave = async () => {
    try {
      if (!user?.restaurant_id) {
        setError('Restaurant not found.');
        return;
      }
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/restaurants/${user.restaurant_id}/settings`,
        {
          name: form.restaurantName,
          logo_url: form.logoUrl,
          address: form.address,
          phone: form.phone,
          opening_hours: form.opening_hours,
          closing_hours: form.closing_hours,
          description: form.description,
          region: form.region,
        },
        { withCredentials: true }
      );
      if (res.data.restaurant) {
        setSettings(res.data.restaurant);
        setEditMode(false);
        if (refreshUser) await refreshUser();
      }
    } catch (err) {
      console.error('Settings update error:', err);
      setError('Failed to update settings.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className={styles.loading}>Loading settings...</div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className={styles.error}>{error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <h1 className={styles.title}>Restaurant Settings</h1>
        {editMode ? (
          <>
            <div className={styles.field}>
              <label>Restaurant Name:</label>
              <input
                type="text"
                name="restaurantName"
                value={form.restaurantName}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.field}>
              <label>Logo:</label>
              <input type="file" name="logoUrl" onChange={handleLogoChange} />
              {form.logoUrl && (
                <img
                  src={form.logoUrl}
                  alt="Restaurant Logo"
                  width="100"
                />
              )}
            </div>
            <div className={styles.field}>
              <label>Address:</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.field}>
              <label>Business Phone:</label>
              <input
                type="tel"
                name="phone"
                pattern="[0-9]*"
                inputMode="numeric"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.field}>
              <label>Opening Hours:</label>
              <input
                type="text"
                name="opening_hours"
                value={form.opening_hours}
                onChange={handleChange}
              />
            </div>
            <div className={styles.field}>
              <label>Closing Hours:</label>
              <input
                type="text"
                name="closing_hours"
                value={form.closing_hours}
                onChange={handleChange}
              />
            </div>
            <div className={styles.field}>
              <label>Description (Motto):</label>
              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleChange}
              />
            </div>
            <div className={styles.field}>
              <label>Region:</label>
              <input
                type="text"
                name="region"
                value={form.region}
                onChange={handleChange}
                disabled
              />
              {/* If region is fixed from registration, you can disable editing */}
            </div>
            <div className={styles.buttons}>
              <button onClick={handleSave}>Save</button>
              <button onClick={() => setEditMode(false)}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.field}>
              <label>Restaurant Name:</label>
              <span>{settings?.restaurant_name}</span>
            </div>
            <div className={styles.field}>
              <label>Logo:</label>
              {settings?.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt="Restaurant Logo"
                  width="100"
                />
              ) : (
                <span>No logo provided</span>
              )}
            </div>
            <div className={styles.field}>
              <label>Address:</label>
              <span>{settings?.address || 'Not provided'}</span>
            </div>
            <div className={styles.field}>
              <label>Business Phone:</label>
              <span>{settings?.phone || 'Not provided'}</span>
            </div>
            <div className={styles.field}>
              <label>Opening Hours:</label>
              <span>{settings?.opening_hours || 'Not provided'}</span>
            </div>
            <div className={styles.field}>
              <label>Closing Hours:</label>
              <span>{settings?.closing_hours || 'Not provided'}</span>
            </div>
            <div className={styles.field}>
              <label>Description (Motto):</label>
              <span>{settings?.description || 'Not provided'}</span>
            </div>
            <div className={styles.field}>
              <label>Region:</label>
              <span>{settings?.region || 'Not provided'}</span>
            </div>
            <div className={styles.field}>
              <label>Plan:</label>
              <span>{settings?.plan || 'Basic'}</span>
            </div>
            <div className={styles.field}>
              <label>QR Code:</label>
              {settings?.qr_code_url ? (
                <img
                  src={settings.qr_code_url}
                  alt="QR Code"
                  width="100"
                />
              ) : (
                <span>No QR Code available</span>
              )}
            </div>
            <div className={styles.buttons}>
              <button onClick={() => setEditMode(true)}>Edit Settings</button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Settings;
