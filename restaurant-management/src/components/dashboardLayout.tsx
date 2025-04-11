import React, { ReactNode } from 'react';
import Header from './header';
import Sidebar from './sidebar';
import styles from './dashboardLayout.module.css';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className={styles.dashboardLayout}>
      <Header />
      <div className={styles.content}>
        <Sidebar />
        <main className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
