import React, { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { Card, Button } from '../../components';
import { getAlerts, resolveAlert, type Alert, type AlertSummary } from '../../services';
import styles from './Alerts.module.css';

export const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setLoading(true);
    try {
      const result = await getAlerts('open');
      setAlerts(result.data || []);
      setSummary(result.summary || null);
    } catch (error) {
      console.error('Failed to fetch alerts', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleResolve = async (id: number) => {
    try {
      await resolveAlert(id);
      fetchAlerts(); // Refresh the list
    } catch (error) {
      console.error('Failed to resolve alert', error);
    }
  };

  return (
    <section className="section-light" style={{ minHeight: '80vh', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Bell size={20} className={styles.icon} style={{ color: 'var(--color-mongo-green)' }} />
              <h2 style={{ margin: 0 }}>System Notifications</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-caption)' }}>
              Real-time anomalies detected by the SmartAgri monitoring network
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {summary && (
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-dark-green)', background: 'rgba(0, 104, 74, 0.1)', padding: '4px 12px', borderRadius: '100px' }}>
                {summary.open_count} ACTIVE
              </span>
            )}
            <Button variant="outlined" onClick={() => fetchAlerts(true)} size="small" style={{ display: 'flex', gap: '4px' }}>
              <RefreshCw size={14} /> Refresh
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
            <p>Fetching active alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <Card elevation="subtle" padding="large" style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <CheckCircle size={48} color="var(--color-mongo-green)" style={{ opacity: 0.5 }} />
            </div>
            <h3 style={{ margin: '0 0 8px 0' }}>All Systems Nominal</h3>
            <p style={{ color: 'var(--text-secondary)' }}>No active alerts detected at this time. Great job!</p>
          </Card>
        ) : (
          <div className={styles.alertList}>
            {alerts.map((alert) => (
              <Card 
                key={alert.id} 
                padding="standard" 
                className={`${styles.alertCard} ${alert.severity === 'critical' ? styles.critical : alert.severity === 'warning' ? styles.warning : styles.info}`}
                elevation="subtle"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <span className={`${styles.severityPill} ${alert.severity === 'critical' ? styles.criticalPill : alert.severity === 'warning' ? styles.warningPill : styles.infoPill}`}>
                      {alert.severity}
                    </span>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: 'var(--font-size-body-large)' }}>{alert.metric_name} Anomaly Detected</h3>
                    <p style={{ color: 'var(--text-primary)', fontSize: 'var(--font-size-body-light)', margin: 0 }}>{alert.message}</p>
                    <div className={styles.time}>
                      <Clock size={12} />
                      {new Date(alert.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>
                  <Button variant="primary" size="small" onClick={() => handleResolve(alert.id)}>
                    Acknowledge
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
