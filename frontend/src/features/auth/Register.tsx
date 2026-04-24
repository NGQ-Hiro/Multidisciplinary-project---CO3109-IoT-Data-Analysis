import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Button } from '../../components';
import { register } from '../../services';
import styles from './Login.module.css';

export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'viewer'>('viewer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await register({ username, password, role });
      navigate('/');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Registration failed. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <Card className={styles.loginCard} elevation="standard" padding="large">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
          <p className="tech-label" style={{ marginBottom: 'var(--space-1)' }}>System Access</p>
          <h2 style={{ fontSize: 'var(--font-size-h1)', margin: 0 }}>Create Account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-caption)', marginTop: '4px' }}>
            Register to join the SmartAgri IoT Platform
          </p>
        </div>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              placeholder="Pick a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="role">Account Type</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'viewer')}
            >
              <option value="viewer">Viewer (Read Only)</option>
              <option value="admin">Administrator (Full Access)</option>
            </select>
          </div>
          
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Button type="submit" fullWidth disabled={loading} size="large">
              {loading ? 'Creating Account...' : 'Register Account'}
            </Button>
          </div>
        </form>
        
        <div style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--font-size-caption)', color: 'var(--text-secondary)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--color-mongo-green)', fontWeight: '700' }}>Login here</Link>
          </p>
        </div>
      </Card>
    </div>
  );
};
