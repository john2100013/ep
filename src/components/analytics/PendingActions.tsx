import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Chip,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  AccountBalance as AccountIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';

interface PendingActionsProps {
  dateRange: string;
}

interface PendingAction {
  id: number;
  type: 'overdue_invoice' | 'low_stock' | 'pending_payment' | 'expired_quotation' | 'reconciliation_needed';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  daysOverdue?: number;
  amount?: number;
  createdAt: string;
}

const PendingActions: React.FC<PendingActionsProps> = ({ dateRange }) => {
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingActions();
  }, [dateRange]);

  const fetchPendingActions = async () => {
    try {
      setLoading(true);
      const { api } = await import('../../services/api');
      const response = await api.get('/analytics/pending-actions');
      
      if (response.data) {
        setActions(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err: any) {
      console.error('Error fetching pending actions:', err);
      setError(err?.response?.data?.error || err?.message || 'Failed to fetch pending actions');
      setActions([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'overdue_invoice': return <ReceiptIcon />;
      case 'low_stock': return <InventoryIcon />;
      case 'pending_payment': return <AccountIcon />;
      case 'expired_quotation': return <InfoIcon />;
      case 'reconciliation_needed': return <WarningIcon />;
      default: return <InfoIcon />;
    }
  };



  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  const highPriorityActions = actions.filter(a => a.priority === 'high');
  const mediumPriorityActions = actions.filter(a => a.priority === 'medium');
  const lowPriorityActions = actions.filter(a => a.priority === 'low');

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Pending Actions
      </Typography>
      
      {actions.length === 0 ? (
        <Alert severity="success" sx={{ mt: 2 }}>
          No pending actions found. All tasks are up to date!
        </Alert>
      ) : (
        <Box display="flex" gap={3} flexDirection={{ xs: 'column', md: 'row' }}>
          <Box flex={1}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="h6" color="error.main">
                    High Priority
                  </Typography>
                  <Badge badgeContent={highPriorityActions.length} color="error">
                    <ErrorIcon />
                  </Badge>
                </Box>
                {highPriorityActions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No high priority actions
                  </Typography>
                ) : (
                  <List dense>
                    {highPriorityActions.map((action, index) => (
                      <React.Fragment key={action.id}>
                        <ListItem>
                          <ListItemIcon>
                            {getActionIcon(action.type)}
                          </ListItemIcon>
                          <ListItemText
                            primary={action.title}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {action.description}
                                </Typography>
                                {action.amount && (
                                  <Typography variant="caption" color="error.main">
                                    Amount: ${action.amount.toLocaleString()}
                                  </Typography>
                                )}
                                {action.daysOverdue && (
                                  <Chip 
                                    label={`${action.daysOverdue} days overdue`}
                                    size="small"
                                    color="error"
                                    sx={{ mt: 0.5 }}
                                  />
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < highPriorityActions.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Box>
          
          <Box flex={1}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="h6" color="warning.main">
                    Medium Priority
                  </Typography>
                  <Badge badgeContent={mediumPriorityActions.length} color="warning">
                    <WarningIcon />
                  </Badge>
                </Box>
                {mediumPriorityActions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No medium priority actions
                  </Typography>
                ) : (
                  <List dense>
                    {mediumPriorityActions.slice(0, 5).map((action, index) => (
                      <React.Fragment key={action.id}>
                        <ListItem>
                          <ListItemIcon>
                            {getActionIcon(action.type)}
                          </ListItemIcon>
                          <ListItemText
                            primary={action.title}
                            secondary={action.description}
                          />
                        </ListItem>
                        {index < Math.min(mediumPriorityActions.length, 5) - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
            
            {lowPriorityActions.length > 0 && (
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography variant="h6" color="info.main">
                      Low Priority
                    </Typography>
                    <Badge badgeContent={lowPriorityActions.length} color="info">
                      <InfoIcon />
                    </Badge>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {lowPriorityActions.length} items for review when time permits
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PendingActions;