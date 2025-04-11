import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/AuthContext';
import { Toaster, toast } from 'react-hot-toast';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import Select from 'react-select';
import Image from 'next/image';
import { getData } from 'country-list';
import { Box, Typography, Stack, Button } from '@mui/material';
import styles from './register.module.css';

// Get country data for the select dropdown
const allCountries: { code: string; name: string }[] = getData();
const countryOptions = allCountries.map((country) => ({
  value: country.code,
  label: country.name,
}));

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  // Basic details
  const [name, setName] = useState('');
  const [plan, setPlan] = useState('Basic');
  const [email, setEmail] = useState('');

  // Password fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Additional details
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [closingHours, setClosingHours] = useState('');
  const [description, setDescription] = useState('');
  const [region, setRegion] = useState({ value: 'US', label: 'United States' });

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState<'Weak' | 'Medium' | 'Strong' | ''>('');

  // Calculate password strength when password changes
  useEffect(() => {
    if (!password) {
      setPasswordStrength('');
      return;
    }
    const lengthCheck = password.length >= 8;
    const symbolCheck = /[^A-Za-z0-9]/.test(password);
    const numberCheck = /\d/.test(password);
    const upperLowerCheck = /[a-z]/.test(password) && /[A-Z]/.test(password);
    let score = 0;
    if (lengthCheck) score++;
    if (symbolCheck) score++;
    if (numberCheck) score++;
    if (upperLowerCheck) score++;
    if (score <= 1) {
      setPasswordStrength('Weak');
    } else if (score === 2 || score === 3) {
      setPasswordStrength('Medium');
    } else {
      setPasswordStrength('Strong');
    }
  }, [password]);

  // Limit description to 500 words
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount <= 500) {
      setDescription(text);
    }
  };

  // Handle form submission
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordStrength === 'Weak') {
      toast.error('Please choose a stronger password.');
      return;
    }

    try {
      // The register function returns the updated user which now includes restaurant_id.
      const registeredUser = await register(
        name,
        email,
        password,
        plan,
        address,
        phone,
        openingHours,
        closingHours,
        description,
        region.value
      );
      // Display the unique restaurant ID in a success message
      toast.success(`Registration successful! Your restaurant unique ID is: ${registeredUser.restaurant_id}`);
      router.push('/dashboard-index');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    }
  }

  return (
    <div className={styles.pageWrapper}>
      <Toaster position="top-right" />

      <header className={styles.header}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              overflow: 'hidden',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Image src="/images/logo.png" alt="QUICKFIT Logo" width={80} height={80} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            QUICKFIT
          </Typography>
        </Stack>
      </header>

      <div className={styles.formContainer}>
        <h1 className={styles.heading}>Register Your Restaurant</h1>
        <Typography variant="body1" className={styles.punchLine}>
          Tired of serving “meh”? Join QUICKFIT and let your restaurant go from "Just okay" to "Chef’s kiss"!
        </Typography>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Restaurant Name */}
          <div className={styles.inputGroup}>
            <label htmlFor="name" className={styles.label}>Restaurant Name</label>
            <input
              id="name"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter restaurant name"
            />
          </div>

          {/* Plan */}
          <div className={styles.inputGroup}>
            <label htmlFor="plan" className={styles.label}>Plan</label>
            <select
              id="plan"
              className={styles.select}
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
            >
              <option value="Basic">Basic</option>
              <option value="Pro">Pro</option>
              <option value="Premium">Premium</option>
            </select>
          </div>

          {/* Email */}
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@restaurant.com"
            />
          </div>

          {/* Password */}
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <div className={styles.passwordContainer}>
              <input
                id="password"
                className={styles.input}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a secure password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.toggleButton}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {password && (
              <div className={styles.strengthBarContainer}>
                <div
                  className={`${styles.strengthBar} ${
                    passwordStrength === 'Weak'
                      ? styles.weak
                      : passwordStrength === 'Medium'
                      ? styles.medium
                      : passwordStrength === 'Strong'
                      ? styles.strong
                      : ''
                  }`}
                />
                <small className={styles.strengthLabel}>
                  {passwordStrength ? `Strength: ${passwordStrength}` : ''}
                </small>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
            <div className={styles.passwordContainer}>
              <input
                id="confirmPassword"
                className={styles.input}
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.toggleButton}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Address */}
          <div className={styles.inputGroup}>
            <label htmlFor="address" className={styles.label}>Address</label>
            <input
              id="address"
              className={styles.input}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Restaurant address"
            />
          </div>

          {/* Phone */}
          <div className={styles.inputGroup}>
            <label htmlFor="phone" className={styles.label}>Phone</label>
            <PhoneInput
              country="us"
              value={phone}
              onChange={setPhone}
              inputClass={styles.input}
              containerClass={styles.phoneContainer}
              buttonClass={styles.phoneButton}
            />
          </div>

          {/* Opening & Closing Hours */}
          <div className={styles.inputRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="openingHours" className={styles.label}>Opening Hours</label>
              <input
                id="openingHours"
                className={styles.input}
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="09:00"
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="closingHours" className={styles.label}>Closing Hours</label>
              <input
                id="closingHours"
                className={styles.input}
                value={closingHours}
                onChange={(e) => setClosingHours(e.target.value)}
                placeholder="22:00"
              />
            </div>
          </div>

          {/* Description */}
          <div className={styles.inputGroup}>
            <label htmlFor="description" className={styles.label}>Description</label>
            <textarea
              id="description"
              className={styles.textarea}
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Enter a brief description of your restaurant (max 500 words)"
            />
          </div>

          {/* Country / Region */}
          <div className={styles.inputGroup}>
            <label htmlFor="region" className={styles.label}>Country / Region</label>
            <div className={styles.regionSelect}>
              <Select
                inputId="region"
                options={countryOptions}
                value={region}
                onChange={(selectedOption) => setRegion(selectedOption!)}
                placeholder="Select a country"
              />
            </div>
          </div>

          {/* Form Buttons */}
          <div className={styles.buttonGroup}>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button
                type="button"
                variant="outlined"
                fullWidth
                onClick={() => router.back()}
                sx={{
                  borderColor: '#0070f3',
                  color: '#0070f3',
                  ':hover': { borderColor: '#0051a3', color: '#0051a3' },
                  height: '3rem'
                }}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  backgroundColor: '#0070f3',
                  ':hover': { backgroundColor: '#0051a3' },
                  height: '3rem'
                }}
              >
                Register
              </Button>
            </Stack>
          </div>
        </form>
      </div>

      <footer className={styles.footer}>
        <p>© 2025 QUICKFIT Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
