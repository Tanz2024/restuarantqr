import React, { useState } from 'react';
import Link from 'next/link';
import { FaBell, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from './AuthContext';
import { useRouter } from 'next/router';
import styles from './header.module.css';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();

  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
    if (showUserMenu) setShowUserMenu(false);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(prev => !prev);
    if (showNotifications) setShowNotifications(false);
  };

  const handleLogout = async () => {
    // Save the current role before logging out
    const currentRole = user?.role;
    await logout();

    // Redirect based on the saved user role.
    if (currentRole === 'admin') {
      router.push('/admin'); // Redirect to admin panel
    } else if (currentRole === 'owner') {
      router.push('/'); // Redirect to restaurant owner home page (index.tsx)
    } else {
      router.push('/'); // Fallback redirection
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSide}></div>

      <div className={styles.center}>
        <Link href="/" className={styles.logo}>
          Restaurant Panel
        </Link>
      </div>

      <div className={styles.rightSide}>
        <div className={styles.notificationWrapper}>
          <button 
            className={styles.iconButton} 
            onClick={toggleNotifications} 
            aria-label="Notifications"
          >
            <FaBell />
          </button>
          {showNotifications && (
            <div className={styles.notificationDropdown}>
              <ul>
                <li>New order received</li>
                <li>Payment completed</li>
                <li>Menu updated</li>
              </ul>
            </div>
          )}
        </div>

        <div className={styles.userWrapper}>
          {user ? (
            <>
              <button 
                className={styles.userButton} 
                onClick={toggleUserMenu} 
                aria-label="User Menu"
              >
                <FaUserCircle className={styles.userIcon} />
              </button>
              {showUserMenu && (
                <div className={styles.userDropdown}>
                  <div className={styles.userInfo}>
                    {user.name} <span>({user.role})</span>
                  </div>
                  <ul className={styles.userOptions}>
                    <li>
                      <Link href="/dashboard/profile" className={styles.userLink}>
                        Profile
                      </Link>
                    </li>
                    <li>
                      <Link href="/dashboard/settings" className={styles.userLink}>
                        Settings
                      </Link>
                    </li>
                    <li>
                      <button onClick={handleLogout} className={styles.logoutButton}>
                        Logout <FaSignOutAlt />
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </>
          ) : (
            <Link href="/login" className={styles.loginLink}>
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
