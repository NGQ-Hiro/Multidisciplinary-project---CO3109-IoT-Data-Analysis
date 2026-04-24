import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import styles from './AppLayout.module.css';

export const AppLayout: React.FC = () => {
  return (
    <div className={`${styles.layout} theme-light`}>
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <div className="container">
          <p>© {new Date().getFullYear()} SmartAgri IoT. MongoDB-inspired design.</p>
        </div>
      </footer>
    </div>
  );
};
