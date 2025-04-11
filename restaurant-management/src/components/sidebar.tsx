import React, { useState } from 'react';
import Link from 'next/link';
import {
  FaBars,
  FaTachometerAlt,
  FaUtensils,
  FaShoppingCart,
  FaChartLine,
} from 'react-icons/fa';
import styles from './Sidebar.module.css';

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => setIsOpen(prev => !prev);

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`} aria-label="Sidebar Navigation">
      <div className={styles.header}>
        <button className={styles.hamburger} onClick={toggleSidebar} aria-label="Toggle Menu">
          <FaBars />
        </button>
        {isOpen && <h2 className={styles.title}>Restaurant Panel</h2>}
      </div>

      <nav className={styles.nav}>
        <ul>
          <li>
            <Link href="/dashboard" className={styles.navLink}>
              <FaTachometerAlt className={styles.icon} aria-hidden="true" />
              {isOpen && <span className={styles.linkText}>My Dashboard</span>}
            </Link>
          </li>
          <li>
            <Link href="/dashboard/menu" className={styles.navLink}>
              <FaUtensils className={styles.icon} aria-hidden="true" />
              {isOpen && <span className={styles.linkText}>Menu Management</span>}
            </Link>
          </li>
          <li>
            <Link href="/dashboard/orders" className={styles.navLink}>
              <FaShoppingCart className={styles.icon} aria-hidden="true" />
              {isOpen && <span className={styles.linkText}>Orders</span>}
            </Link>
          </li>
          <li>
            <Link href="/dashboard/analytics" className={styles.navLink}>
              <FaChartLine className={styles.icon} aria-hidden="true" />
              {isOpen && <span className={styles.linkText}>Analytics</span>}
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
