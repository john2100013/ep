import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Storage as DatabaseIcon,
  CloudSync as SyncIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useDatabase } from '../contexts/DatabaseContext';

interface SyncHistory {
  timestamp: string;
  success: boolean;
  message: string;
  stats?: any;
}

const DatabaseSettingsScreen: React.FC = () => {
  const {
    mode,
    isVercel,
    canSwitchMode,
    canSync,
    isLoading,
    switchMode,
    syncData,
    refreshStatus,
  } = useDatabase();

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [autoSyncInterval, setAutoSyncInterval] = useState<number>(60); // minutes
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [autoSyncTimer, setAutoSyncTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Load settings from localStorage
    const savedAutoSync = localStorage.getItem('autoSyncEnabled');
    const savedInterval = localStorage.getItem('autoSyncInterval');
    const savedHistory = localStorage.getItem('syncHistory');

    if (savedAutoSync) {
      setAutoSyncEnabled(savedAutoSync === 'true');
    }
    if (savedInterval) {
      setAutoSyncInterval(parseInt(savedInterval, 10));
    }
    if (savedHistory) {
      setSyncHistory(JSON.parse(savedHistory));
    }

    // Load last sync time
    const lastSync = localStorage.getItem('lastSyncTime');
    if (lastSync) {
      setLastSyncTime(lastSync);
    }

    // Refresh status on mount
    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    // Clear existing timer
    if (autoSyncTimer) {
      clearInterval(autoSyncTimer);
    }

    // Set up auto-sync if enabled and in local mode
    if (autoSyncEnabled && canSync && mode === 'local') {
      const intervalMs = autoSyncInterval * 60 * 1000; // Convert minutes to milliseconds
      const timer = setInterval(() => {
        handleAutoSync();
      }, intervalMs);
      setAutoSyncTimer(timer);

      return () => {
        clearInterval(timer);
      };
    }
  }, [autoSyncEnabled, autoSyncInterval, canSync, mode]);

  const handleModeToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newMode = event.target.checked ? 'neon' : 'local';
    try {
      await switchMode(newMode);
      // Disable auto-sync if switching to Neon mode
      if (newMode === 'neon') {
        setAutoSyncEnabled(false);
        localStorage.setItem('autoSyncEnabled', 'false');
      }
    } catch (error: any) {
      alert(`Failed to switch database mode: ${error.message}`);
    }
  };

  const handleSyncClick = () => {
    setSyncDialogOpen(true);
    setSyncResult(null);
  };

  const handleSyncConfirm = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncData();
      setSyncResult(result);
      
      // Save to history
      const historyEntry: SyncHistory = {
        timestamp: new Date().toISOString(),
        success: result.success,
        message: result.message,
        stats: result.data,
      };
      const newHistory = [historyEntry, ...syncHistory].slice(0, 10); // Keep last 10
      setSyncHistory(newHistory);
      localStorage.setItem('syncHistory', JSON.stringify(newHistory));
      
      // Update last sync time
      const now = new Date().toISOString();
      setLastSyncTime(now);
      localStorage.setItem('lastSyncTime', now);

      if (result.success) {
        setTimeout(() => {
          setSyncDialogOpen(false);
        }, 3000);
      }
    } catch (error: any) {
      setSyncResult({
        success: false,
        message: error.message || 'Failed to sync data',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleAutoSync = async () => {
    try {
      const result = await syncData();
      const historyEntry: SyncHistory = {
        timestamp: new Date().toISOString(),
        success: result.success,
        message: result.message,
        stats: result.data,
      };
      const newHistory = [historyEntry, ...syncHistory].slice(0, 10);
      setSyncHistory(newHistory);
      localStorage.setItem('syncHistory', JSON.stringify(newHistory));
      
      const now = new Date().toISOString();
      setLastSyncTime(now);
      localStorage.setItem('lastSyncTime', now);
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  };

  const handleAutoSyncToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setAutoSyncEnabled(enabled);
    localStorage.setItem('autoSyncEnabled', enabled.toString());
    
    if (!enabled && autoSyncTimer) {
      clearInterval(autoSyncTimer);
      setAutoSyncTimer(null);
    }
  };

  const handleIntervalChange = (event: any) => {
    const interval = parseInt(event.target.value, 10);
    setAutoSyncInterval(interval);
    localStorage.setItem('autoSyncInterval', interval.toString());
  };

  // Don't show this page on Vercel - redirect or show message
  if (isVercel) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Database Settings
              </Typography>
              <Typography>
                You are running on Vercel. The application is directly connected to the Neon cloud database.
                Database settings are only available when running the Electron desktop application.
              </Typography>
            </Alert>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
              <DatabaseIcon color="primary" />
              <Box>
                <Typography variant="body1" fontWeight="bold">
                  Current Database: Neon Cloud
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All data is automatically saved to the cloud database
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Database Settings
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          {/* Database Mode Card */}
          <Box sx={{ flex: 1, minWidth: { xs: '100%', md: '48%' } }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DatabaseIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Database Mode</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={mode === 'neon'}
                      onChange={handleModeToggle}
                      disabled={isLoading || !canSwitchMode}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        {mode === 'local' ? 'Local PostgreSQL' : 'Neon Cloud Database'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {mode === 'local'
                          ? 'Data is saved to your local PostgreSQL database'
                          : 'Data is saved to Neon cloud database'}
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              <Box sx={{ mt: 2 }}>
                <Chip
                  label={mode === 'local' ? 'Local Mode' : 'Cloud Mode'}
                  color={mode === 'local' ? 'default' : 'primary'}
                  icon={mode === 'local' ? <DatabaseIcon /> : <DatabaseIcon />}
                />
              </Box>

              {mode === 'local' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    When using local mode, you can sync your data to the cloud database manually or automatically.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
          </Box>

          {/* Sync Status Card */}
          <Box sx={{ flex: 1, minWidth: { xs: '100%', md: '48%' } }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SyncIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Sync Status</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Last Sync:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {lastSyncTime
                    ? new Date(lastSyncTime).toLocaleString()
                    : 'Never'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Auto-Sync:
                </Typography>
                <Chip
                  label={autoSyncEnabled ? 'Enabled' : 'Disabled'}
                  color={autoSyncEnabled ? 'success' : 'default'}
                  size="small"
                />
                {autoSyncEnabled && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Every {autoSyncInterval} minute(s)
                  </Typography>
                )}
              </Box>

              <Button
                variant="contained"
                startIcon={<SyncIcon />}
                onClick={handleSyncClick}
                disabled={!canSync || syncing}
                fullWidth
                sx={{ mt: 2 }}
              >
                {syncing ? 'Syncing...' : 'Sync to Cloud Now'}
              </Button>
            </CardContent>
          </Card>
          </Box>
        </Box>

        {/* Auto-Sync Settings Card */}
        {canSync && mode === 'local' && (
          <Box sx={{ width: '100%' }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ScheduleIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Auto-Sync Settings</Typography>
                </Box>
                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoSyncEnabled}
                        onChange={handleAutoSyncToggle}
                        color="primary"
                      />
                    }
                    label="Enable Automatic Sync"
                  />
                  <Typography variant="caption" display="block" sx={{ mt: 1, ml: 4 }}>
                    Automatically sync data from local database to cloud database at regular intervals
                  </Typography>
                </Box>

                {autoSyncEnabled && (
                  <Box sx={{ mb: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>Sync Interval</InputLabel>
                      <Select
                        value={autoSyncInterval}
                        onChange={handleIntervalChange}
                        label="Sync Interval"
                      >
                        <MenuItem value={15}>Every 15 minutes</MenuItem>
                        <MenuItem value={30}>Every 30 minutes</MenuItem>
                        <MenuItem value={60}>Every hour</MenuItem>
                        <MenuItem value={120}>Every 2 hours</MenuItem>
                        <MenuItem value={240}>Every 4 hours</MenuItem>
                        <MenuItem value={480}>Every 8 hours</MenuItem>
                        <MenuItem value={1440}>Every 24 hours</MenuItem>
                      </Select>
                    </FormControl>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Next sync will occur in approximately {autoSyncInterval} minute(s)
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Sync History Card */}
        {syncHistory.length > 0 && (
          <Box sx={{ width: '100%' }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sync History
                </Typography>
                <Divider sx={{ my: 2 }} />
                <List>
                  {syncHistory.map((entry, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {entry.success ? (
                              <CheckCircleIcon color="success" fontSize="small" />
                            ) : (
                              <ErrorIcon color="error" fontSize="small" />
                            )}
                            <Typography variant="body2">
                              {new Date(entry.timestamp).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                        secondary={entry.message}
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={entry.success ? 'Success' : 'Failed'}
                          color={entry.success ? 'success' : 'error'}
                          size="small"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Information Card */}
        <Box sx={{ width: '100%' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                How It Works
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box component="ul" sx={{ pl: 2 }}>
                <li>
                  <Typography variant="body2" paragraph>
                    <strong>Local Mode:</strong> All data is saved to your local PostgreSQL database. 
                    This is faster and works offline. Use this for development or when you don't have internet.
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" paragraph>
                    <strong>Cloud Mode:</strong> All data is saved directly to the Neon cloud database. 
                    This requires an internet connection but allows access from anywhere.
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" paragraph>
                    <strong>Sync:</strong> When in local mode, you can sync your data to the cloud database. 
                    Existing records are updated, and new records are inserted. This ensures your cloud database 
                    stays up-to-date with your local changes.
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    <strong>Auto-Sync:</strong> Automatically syncs your local data to the cloud at regular intervals. 
                    This is useful for keeping your cloud database updated without manual intervention.
                  </Typography>
                </li>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Sync Dialog */}
      <Dialog open={syncDialogOpen} onClose={() => !syncing && setSyncDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Sync Data to Cloud Database</DialogTitle>
        <DialogContent>
          {syncing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 3 }}>
              <CircularProgress />
              <Typography>Syncing data to Neon database...</Typography>
              <Typography variant="body2" color="text.secondary">
                This may take a few moments depending on the amount of data.
              </Typography>
            </Box>
          ) : syncResult ? (
            <Box sx={{ mt: 2 }}>
              <Alert severity={syncResult.success ? 'success' : 'error'} sx={{ mb: 2 }}>
                {syncResult.message}
              </Alert>
              {syncResult.success && syncResult.data && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Sync Summary:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tables synced: {syncResult.data.syncedTables?.length || 0}
                  </Typography>
                  {syncResult.data.stats && (
                    <Box sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                      {Object.entries(syncResult.data.stats).map(([table, stats]: [string, any]) => (
                        <Typography key={table} variant="caption" display="block">
                          {table}: {stats.inserted} inserted, {stats.updated} updated, {stats.errors} errors
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
              {syncResult.data?.errors && syncResult.data.errors.length > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Errors:</Typography>
                  <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                    {syncResult.data.errors.map((error: string, idx: number) => (
                      <li key={idx}>
                        <Typography variant="caption">{error}</Typography>
                      </li>
                    ))}
                  </Box>
                </Alert>
              )}
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                This will sync all data from your local PostgreSQL database to the Neon cloud database.
                Existing records will be updated, and new records will be inserted.
              </Alert>
              <Typography variant="body2" color="text.secondary">
                Make sure you have an active internet connection before syncing.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!syncing && (
            <>
              <Button onClick={() => setSyncDialogOpen(false)}>Cancel</Button>
              {!syncResult && (
                <Button onClick={handleSyncConfirm} variant="contained" color="primary">
                  Start Sync
                </Button>
              )}
              {syncResult && (
                <Button onClick={() => setSyncDialogOpen(false)} variant="contained">
                  Close
                </Button>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DatabaseSettingsScreen;

