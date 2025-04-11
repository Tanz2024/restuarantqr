import { useState, useEffect, ChangeEvent } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/dashboardLayout';
import { useAuth } from '@/components/AuthContext';
import styles from './profile.module.css';

// Interfaces for user and restaurant
interface RestaurantProfile {
  restaurant_name: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  opening_hours?: string;
  closing_hours?: string;
  description?: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;        // Comes from users table (alias: user_phone)
  role: string;
  created_at?: string;   // Joined date from the users table
  restaurant?: RestaurantProfile;
}

// Form state now includes password fields
interface FormState {
  name: string;
  email: string;
  phone: string;
  oldPassword: string;
  newPassword: string;
}

// Helper function to format date as dd/mm/yyyy (en-GB locale)
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB'); // e.g. "04/05/2025"
}

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    oldPassword: '',
    newPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { refreshUser } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/profile`,
          { withCredentials: true }
        );
        if (res.data.user) {
          const user: UserProfile = res.data.user;
          setProfile(user);
          setForm({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            oldPassword: '',
            newPassword: '',
          });
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError('Failed to fetch profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle form changes; for phone, restrict to digits only.
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone' && !/^\d*$/.test(value)) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Save updated profile (and optionally change password)
  const handleSave = async () => {
    // Basic validations
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!form.email.includes('@')) {
      setError('A valid email is required.');
      return;
    }

    try {
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/profile/update`,
        {
          name: form.name,
          email: form.email,
          phone: form.phone,
          oldPassword: form.oldPassword, // Will be processed by the backend if provided
          newPassword: form.newPassword, // Ditto
        },
        { withCredentials: true }
      );
      if (res.data.user) {
        setProfile(res.data.user);
        setEditMode(false);
        // Clear password fields
        setForm((prev) => ({
          ...prev,
          oldPassword: '',
          newPassword: '',
        }));
        if (refreshUser) await refreshUser();
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError('Failed to update profile.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className={styles.loading}>Loading profile...</div>
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
        <h1 className={styles.title}>Your Profile</h1>
        {editMode ? (
          <>
            <div className={styles.profileInfo}>
              <label>Name:</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.profileInfo}>
              <label>Email:</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.profileInfo}>
              <label>Phone:</label>
              <input
                type="tel"
                name="phone"
                pattern="[0-9]*"
                inputMode="numeric"
                value={form.phone}
                onChange={handleChange}
              />
            </div>
            {/* Password change section */}
            <div className={styles.profileInfo}>
              <label>Old Password:</label>
              <input
                type="password"
                name="oldPassword"
                value={form.oldPassword}
                onChange={handleChange}
              />
            </div>
            <div className={styles.profileInfo}>
              <label>New Password:</label>
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
              />
            </div>
            <div className={styles.buttons}>
              <button onClick={handleSave}>Save</button>
              <button onClick={() => setEditMode(false)}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.profileInfo}>
              <label>Name:</label>
              <span>{profile?.name}</span>
            </div>
            <div className={styles.profileInfo}>
              <label>Email:</label>
              <span>{profile?.email}</span>
            </div>
            <div className={styles.profileInfo}>
              <label>Phone:</label>
              <span>{profile?.phone || 'Not provided'}</span>
            </div>
            <div className={styles.profileInfo}>
              <label>Role:</label>
              <span>{profile?.role}</span>
            </div>
            {profile?.created_at && (
              <div className={styles.profileInfo}>
                <label>Joined:</label>
                <span>{formatDate(profile.created_at)}</span>
              </div>
            )}
            <div className={styles.buttons}>
              <button onClick={() => setEditMode(true)}>Edit Profile</button>
              {/* Optionally add a separate "Change Password" modal/button if preferred */}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Profile;
