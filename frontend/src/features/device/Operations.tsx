import React, { useEffect, useState, useCallback } from 'react';
import { Card, Button } from '../../components';
import { 
  getActuators, 
  toggleActuator, 
  getActuatorLogs, 
  type Actuator, 
  type ActuatorLog,
  getConfigurations, 
  updateConfiguration, 
  type Configuration 
} from '../../services';
import styles from './Operations.module.css';

export const Operations: React.FC = () => {
  const [actuators, setActuators] = useState<Actuator[]>([]);
  const [configs, setConfigs] = useState<Configuration[]>([]);
  const [logs, setLogs] = useState<ActuatorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingConfig, setUpdatingConfig] = useState<number | null>(null);
  const [manualDurations, setManualDurations] = useState<Record<string, number>>({});

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setLoading(true);
    try {
      const [actuatorData, configData, logData] = await Promise.all([
        getActuators(),
        getConfigurations(),
        getActuatorLogs()
      ]);
      setActuators(actuatorData || []);
      setConfigs(configData || []);
      setLogs(logData || []);
      
      // Initialize manual durations if not set
      const durations: Record<string, number> = {};
      actuatorData.forEach(a => {
        durations[a.device_code] = 10; // Default 10 mins
      });
      setManualDurations(prev => ({ ...durations, ...prev }));
    } catch (error) {
      console.error('Failed to fetch operations data', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggle = async (id: string, action: 'ON' | 'OFF') => {
    try {
      const duration = manualDurations[id] || 10;
      await toggleActuator(id, action, duration);
      await fetchData(); // Refresh everything
    } catch (error) {
      console.error(`Failed to toggle actuator ${id}`, error);
      alert('Failed to send command to actuator.');
    }
  };

  const handleResumeAuto = async (id: string) => {
    try {
      const actuator = actuators.find(a => a.device_code === id);
      // To set to AUTO, we send a toggle request with NO duration
      await toggleActuator(id, actuator?.status || 'OFF', undefined);
      await fetchData();
    } catch (error) {
      console.error(`Failed to resume auto for ${id}`, error);
    }
  };

  const handleDurationChange = (id: string, val: string) => {
    const num = parseInt(val) || 0;
    setManualDurations(prev => ({ ...prev, [id]: num }));
  };

  const handleConfigChange = (id: number, field: keyof Configuration, value: string) => {
    setConfigs(prev => prev.map(c => 
      c.id === id ? { ...c, [field]: parseFloat(value) || 0 } : c
    ));
  };

  const handleSaveConfig = async (config: Configuration) => {
    setUpdatingConfig(config.id);
    try {
      await updateConfiguration(config);
      alert('Configuration updated successfully.');
      await fetchData();
    } catch (error) {
      console.error('Failed to update configuration', error);
      alert('Failed to update configuration.');
    } finally {
      setUpdatingConfig(null);
    }
  };

  return (
    <>
      <section className="section-dark">
        <div className="container">
          <p className="tech-label">SYSTEM CONTROL</p>
          <h1 style={{ marginTop: 'var(--space-1)', color: 'var(--color-mongo-green)' }}>Device Operations</h1>
          <p style={{ fontSize: 'var(--font-size-body-large)', color: 'var(--color-silver-teal)', maxWidth: '600px', lineHeight: '1.4' }}>
            Fine-tune your ecosystem by setting intelligent thresholds and managing hardware overrides.
          </p>
        </div>
      </section>

      <section className="section-light" style={{ backgroundColor: 'var(--bg-secondary)', paddingBottom: 'var(--space-10)' }}>
        <div className="container">
          
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 style={{ marginBottom: '4px' }}>Threshold Configurations</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-caption)' }}>Define optimal ranges for automated system responses</p>
              </div>
              <Button variant="outlined" onClick={() => fetchData(true)} size="small">Refresh Data</Button>
            </div>

            {loading ? (
              <div className={styles.grid}>
                {[1, 2, 3].map(i => <Card key={i} elevation="none"><p>Loading configs...</p></Card>)}
              </div>
            ) : configs.length === 0 ? (
              <Card elevation="none"><p>No threshold configurations found.</p></Card>
            ) : (
              <div className={styles.grid}>
                {configs.map((config) => (
                  <Card key={config.id} className={styles.configCard} elevation="subtle" padding="large">
                    <div className={styles.cardHeader}>
                      <div>
                        <p className="tech-label" style={{ backgroundColor: 'transparent', padding: 0, marginBottom: '4px' }}>METRIC</p>
                        <h3 style={{ margin: 0, fontSize: 'var(--font-size-h2)' }}>
                          {config.metric_name === 0 ? 'Temperature' : 
                           config.metric_name === 1 ? 'Humidity' : 
                           config.metric_name === 2 ? 'Light Intensity' : 'Unknown'}
                        </h3>
                      </div>
                      <Button 
                        size="small" 
                        onClick={() => handleSaveConfig(config)}
                        disabled={updatingConfig === config.id}
                        variant={updatingConfig === config.id ? 'outlined' : 'primary'}
                      >
                        {updatingConfig === config.id ? 'Saving...' : 'Update'}
                      </Button>
                    </div>

                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label>Ideal Min</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={config.ideal_min} 
                          onChange={(e) => handleConfigChange(config.id, 'ideal_min', e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Ideal Max</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={config.ideal_max} 
                          onChange={(e) => handleConfigChange(config.id, 'ideal_max', e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Critical Min</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={config.critical_min} 
                          onChange={(e) => handleConfigChange(config.id, 'critical_min', e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Critical Max</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={config.critical_max} 
                          onChange={(e) => handleConfigChange(config.id, 'critical_max', e.target.value)}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-3)', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: 'var(--color-cool-gray)', fontWeight: '600' }}>
                        ID: {config.id.toString().padStart(3, '0')}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--color-cool-gray)' }}>
                        Last updated: {new Date(config.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 style={{ marginBottom: '4px' }}>Actuator Control</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-caption)' }}>Direct hardware interaction and manual state management</p>
              </div>
            </div>

            {loading ? (
              <div className={styles.grid}>
                {[1, 2, 3].map(i => <Card key={i} elevation="none"><p>Loading devices...</p></Card>)}
              </div>
            ) : actuators.length === 0 ? (
              <Card elevation="none"><p>No actuators found.</p></Card>
            ) : (
              <div className={styles.grid}>
                {actuators.map((actuator) => (
                  <Card key={actuator.device_code} elevation="subtle" padding="large">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                       <div>
                         <p className="tech-label" style={{ backgroundColor: 'transparent', padding: 0, marginBottom: '4px' }}>{actuator.type}</p>
                         <h3 style={{ margin: 0, fontSize: 'var(--font-size-h2)' }}>{actuator.name}</h3>
                         <p style={{ fontSize: '10px', color: 'var(--color-cool-gray)', marginTop: '4px' }}>CODE: {actuator.device_code}</p>
                       </div>
                       <div className={`${styles.statusPill} ${actuator.status === 'ON' ? styles.statusOn : styles.statusOff}`}>
                         {actuator.status}
                       </div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                      <Button 
                        variant={actuator.status === 'ON' ? 'darkTeal' : 'primary'} 
                        onClick={() => handleToggle(actuator.device_code, 'ON')}
                        disabled={actuator.status === 'ON'}
                        fullWidth
                        size="small"
                      >
                        TURN ON
                      </Button>
                      <Button 
                        variant="outlined" 
                        onClick={() => handleToggle(actuator.device_code, 'OFF')}
                        disabled={actuator.status === 'OFF'}
                        fullWidth
                        size="small"
                      >
                        TURN OFF
                      </Button>
                    </div>

                    <div className={styles.durationGroup}>
                      <label className={styles.durationLabel}>OVERRIDE DURATION (MIN):</label>
                      <input 
                        type="number" 
                        className={styles.durationInput}
                        value={manualDurations[actuator.device_code] || 10}
                        onChange={(e) => handleDurationChange(actuator.device_code, e.target.value)}
                        min="1"
                      />
                    </div>

                    {actuator.mode === 'MANUAL' && (
                      <div style={{ marginTop: 'var(--space-3)' }}>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          fullWidth 
                          onClick={() => handleResumeAuto(actuator.device_code)}
                          style={{ borderColor: 'var(--color-mongo-green)', color: 'var(--color-dark-green)', fontSize: '10px' }}
                        >
                          RESUME AUTO MODE
                        </Button>
                        {actuator.manual_expire_at && (
                          <div style={{ marginTop: 'var(--space-2)', padding: '6px', background: 'rgba(0, 108, 250, 0.05)', borderRadius: '4px', textAlign: 'center' }}>
                            <p style={{ fontSize: '9px', color: 'var(--color-action-blue)', fontWeight: '700', textTransform: 'uppercase' }}>
                              Manual override expires at {new Date(actuator.manual_expire_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className={styles.section} style={{ marginBottom: 0 }}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 style={{ marginBottom: '4px' }}>System Logs</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-caption)' }}>Audit trail of recent device actions and triggers</p>
              </div>
            </div>

            <div className={styles.tableContainer}>
              {loading ? (
                <p style={{ padding: 'var(--space-4)', textAlign: 'center' }}>Synchronizing logs...</p>
              ) : logs.length === 0 ? (
                <p style={{ padding: 'var(--space-4)', color: 'var(--text-secondary)', textAlign: 'center' }}>No action history available for this period.</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Device Code</th>
                      <th>Action</th>
                      <th>Trigger</th>
                      <th>Audit Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ whiteSpace: 'nowrap', fontWeight: '500' }}>{new Date(log.action_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td style={{ fontFamily: 'var(--font-family-code)', color: 'var(--color-dark-green)' }}>{log.actuator_code}</td>
                        <td>
                          <span className={`${styles.statusPillSmall} ${log.action === 'ON' ? styles.statusOn : styles.statusOff}`}>
                            {log.action}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${log.trigger_source === 'manual' ? styles.badgeManual : styles.badgeAuto}`}>
                            {log.trigger_source}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>{log.note || 'No additional details.'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

