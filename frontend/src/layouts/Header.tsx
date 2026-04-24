import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Leaf, LogOut, User as UserIcon } from 'lucide-react';
import styles from './Header.module.css';
import { Button } from '../components';
import { logout, getCurrentUser } from '../services';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Overview', path: '/' },
    { label: 'Alerts', path: '/alerts' },
    { label: 'Operations', path: '/operations' },
  ];

  return (
    <header className={styles.header}>
      <div className={`container ${styles.container}`}>
        <Link to="/" className={styles.logo}>
          <Leaf className={styles.icon} size={28} />
          <span className={styles.wordmark}>Smart Agricultural</span>
        </Link>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path} 
              className={
                (item.path === '/' && location.pathname === '/') || 
                (item.path !== '/' && location.pathname.startsWith(item.path))
                  ? styles.active 
                  : ''
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <Link to="/recommendations">
            <Button variant="primary" size="small">Recommendations</Button>
          </Link>
          
          {user && (
            <div className={styles.userSection}>
              <UserIcon size={16} />
              <span className={styles.username}>{user.username}</span>
              <button 
                onClick={handleLogout} 
                className={styles.logoutBtn}
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
