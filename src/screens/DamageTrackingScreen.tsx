import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Chip,
  Alert,
  Card,
  CardContent,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Warning as DamageIcon,
  ReportProblem as ReportIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { ApiService } from '../services/api';
import Sidebar from '../components/Sidebar';

interface DamageRecord {
  id: number;
  damage_number: string;
  damage_date: string;
  damage_type: 'damaged' | 'expired' | 'lost' | 'stolen' | 'other';
  total_cost: number;
  reason: string;
  notes?: string;
  status: 'pending' | 'processed' | 'cancelled';
  created_at: string;
  lines?: DamageLine[];
}

interface DamageLine {
  id?: number;
  item_id: number;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  description: string;
  code: string;
  uom: string;
  item_name?: string;
}

interface Item {
  id: number;
  item_name: string;
  description: string;
  buying_price: number;
  selling_price: number;
  quantity: number;
  code: string;
  uom: string;
}

const DamageTrackingScreen: React.FC = () => {
  const [damages, setDamages] = useState<DamageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form data
  const [damageDate, setDamageDate] = useState<Date | null>(new Date());
  const [damageType, setDamageType] = useState<string>('damaged');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<DamageLine[]>([{
    item_id: 0,
    quantity: 1,
    unit_cost: 0,
    total_cost: 0,
    description: '',
    code: '',
    uom: '',
    item_name: ''
  }]);

  // Data
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load damage records and items
      const [damagesRes, itemsRes] = await Promise.all([
        ApiService.get('/damage-records'),
        ApiService.getItems()
      ]);

      if (damagesRes.success) {
        setDamages(damagesRes.data.damages || []);
      }
      
      if (itemsRes.success) {
        setItems(itemsRes.data.items || []);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setDamageDate(new Date());
    setDamageType('damaged');
    setReason('');
    setNotes('');
    setLines([{
      item_id: 0,
      quantity: 1,
      unit_cost: 0,
      total_cost: 0,
      description: '',
      code: '',
      uom: '',
      item_name: ''
    }]);
  };

  const addLine = () => {
    setLines([...lines, {
      item_id: 0,
      quantity: 1,
      unit_cost: 0,
      total_cost: 0,
      description: '',
      code: '',
      uom: '',
      item_name: ''
    }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof DamageLine, value: any) => {
    const updatedLines = [...lines];
    updatedLines[index] = { ...updatedLines[index], [field]: value };
    
    // Auto-fill item details when item is selected
    if (field === 'item_id' && value) {
      const selectedItem = items.find(item => item.id === value);
      if (selectedItem) {
        updatedLines[index] = {
          ...updatedLines[index],
          description: selectedItem.description || selectedItem.item_name,
          code: selectedItem.code,
          uom: selectedItem.uom || 'PCS',
          unit_cost: selectedItem.buying_price || selectedItem.selling_price,
          item_name: selectedItem.item_name
        };
      }
    }
    
    // Calculate total cost
    if (field === 'quantity' || field === 'unit_cost') {
      updatedLines[index].total_cost = updatedLines[index].quantity * updatedLines[index].unit_cost;
    }
    
    setLines(updatedLines);
  };

  const calculateTotalCost = () => {
    return lines.reduce((sum, line) => sum + line.total_cost, 0);
  };

  const handleSubmit = async () => {
    try {
      if (!damageDate || !reason || lines.length === 0) {
        setError('Please fill in all required fields');
        return;
      }

      // Validate that all lines have items and quantities > 0
      const invalidLines = lines.some(line => !line.item_id || line.quantity <= 0);
      if (invalidLines) {
        setError('Please ensure all lines have valid items and quantities');
        return;
      }

      const totalCost = calculateTotalCost();

      const damageData = {
        damage_date: damageDate?.toISOString().split('T')[0],
        damage_type: damageType,
        reason,
        notes,
        total_cost: totalCost,
        lines: lines.map(line => ({
          item_id: line.item_id,
          quantity: line.quantity,
          unit_cost: line.unit_cost,
          description: line.description,
          code: line.code,
          uom: line.uom
        }))
      };

      const response = await ApiService.post('/damage-records', damageData);

      if (response.success) {
        setSuccess('Damage record created successfully!');
        await loadData();
        handleCloseDialog();
      } else {
        setError(response.message || 'Failed to create damage record');
      }
    } catch (err) {
      setError('Failed to create damage record');
      console.error('Submit error:', err);
    }
  };

  const processDamage = async (damageId: number) => {
    try {
      const response = await ApiService.put(`/damage-records/${damageId}/process`);
      if (response.success) {
        setSuccess('Damage record processed successfully! Stock quantities updated.');
        await loadData();
      } else {
        setError(response.message || 'Failed to process damage record');
      }
    } catch (err) {
      setError('Failed to process damage record');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case 'processed': return 'success';
      case 'cancelled': return 'error';
      default: return 'warning';
    }
  };

  const getDamageTypeColor = (type: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (type) {
      case 'damaged': return 'error';
      case 'expired': return 'warning';
      case 'lost': return 'info';
      case 'stolen': return 'error';
      default: return 'default';
    }
  };

  const getDamageTypeLabel = (type: string) => {
    switch (type) {
      case 'damaged': return 'Damaged';
      case 'expired': return 'Expired';
      case 'lost': return 'Lost';
      case 'stolen': return 'Stolen';
      case 'other': return 'Other';
      default: return type.toUpperCase();
    }
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading damage records...</Typography>
      </Container>
    );
  }

  // Calculate stats for sidebar
  const currentStats = {
    total: damages.length,
    totalValue: damages.reduce((sum: number, record: DamageRecord) => sum + record.total_cost, 0),
    statusCounts: {
      pending: damages.filter((record: DamageRecord) => record.status === 'pending').length,
      processed: damages.filter((record: DamageRecord) => record.status === 'processed').length,
      cancelled: damages.filter((record: DamageRecord) => record.status === 'cancelled').length,
      damaged: damages.filter((record: DamageRecord) => record.damage_type === 'damaged').length,
      expired: damages.filter((record: DamageRecord) => record.damage_type === 'expired').length,
      lost: damages.filter((record: DamageRecord) => record.damage_type === 'lost').length,
      stolen: damages.filter((record: DamageRecord) => record.damage_type === 'stolen').length,
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: 'flex', width: '100vw', minHeight: '100vh', margin: 0 }}>
        {/* Sidebar - hidden on mobile */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Sidebar 
            title="Damage Tracking"
            currentStats={currentStats}
          />
        </Box>

        {/* Main Content */}
        <Box sx={{ 
          marginLeft: { xs: 0, md: '350px' }, 
          width: { xs: '100%', md: 'calc(100vw - 350px - 24px)' }, 
          p: { xs: 2, md: 3 }, 
          paddingRight: { xs: 0, md: '24px' },
          overflow: 'auto'
        }}>
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 2 } }}>
            <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' }, display: 'flex', alignItems: 'center' }}>
              <DamageIcon sx={{ mr: 2, fontSize: { xs: 20, md: 28 }, color: 'error.main' }} />
              Damage Tracking
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
              color="error"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Record Damage
            </Button>
          </Box>

          {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          <TableContainer component={Paper} sx={{ overflowX: { xs: 'auto', md: 'visible' }, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Damage #</TableCell>
                  <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell align="right">Total Cost</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {damages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No damage records found. Record your first damage incident to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                damages.map((damage) => (
                  <TableRow key={damage.id}>
                    <TableCell>{damage.damage_number}</TableCell>
                    <TableCell>{format(new Date(damage.damage_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Chip
                        label={getDamageTypeLabel(damage.damage_type)}
                        color={getDamageTypeColor(damage.damage_type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{damage.reason}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(damage.total_cost)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={damage.status.toUpperCase()}
                        color={getStatusColor(damage.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {damage.status === 'pending' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => processDamage(damage.id)}
                        >
                          Process
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Create Damage Record Dialog */}
          <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ReportIcon sx={{ mr: 1, color: 'error.main' }} />
                Record Damage/Loss
              </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              {/* Damage Information */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Damage Information</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      <Box sx={{ flex: 1, minWidth: '300px' }}>
                        <DatePicker
                          label="Damage Date *"
                          value={damageDate}
                          onChange={(newValue) => setDamageDate(newValue)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              required: true
                            }
                          }}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: '300px' }}>
                        <FormControl fullWidth>
                          <InputLabel>Damage Type *</InputLabel>
                          <Select
                            value={damageType}
                            onChange={(e) => setDamageType(e.target.value)}
                            label="Damage Type *"
                            required
                          >
                            <MenuItem value="damaged">Damaged</MenuItem>
                            <MenuItem value="expired">Expired</MenuItem>
                            <MenuItem value="lost">Lost</MenuItem>
                            <MenuItem value="stolen">Stolen</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>
                    <TextField
                      fullWidth
                      label="Reason for Damage/Loss *"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                      multiline
                      rows={2}
                    />
                    <TextField
                      fullWidth
                      label="Additional Notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      multiline
                      rows={2}
                    />
                  </Box>
                </CardContent>
              </Card>

              {/* Damaged Items */}
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Damaged/Lost Items</Typography>
                    <Button startIcon={<AddIcon />} onClick={addLine}>
                      Add Item
                    </Button>
                  </Box>
                  
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Qty</TableCell>
                          <TableCell>Unit Cost</TableCell>
                          <TableCell>Total Cost</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {lines.map((line, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Autocomplete
                                options={items}
                                getOptionLabel={(option) => `${option.code} - ${option.item_name}`}
                                value={items.find(item => item.id === line.item_id) || null}
                                onChange={(_, newValue) => updateLine(index, 'item_id', newValue?.id || 0)}
                                renderInput={(params) => (
                                  <TextField {...params} size="small" sx={{ minWidth: 200 }} />
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                value={line.description}
                                onChange={(e) => updateLine(index, 'description', e.target.value)}
                                sx={{ minWidth: 150 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={line.quantity}
                                onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 0)}
                                sx={{ width: 80 }}
                                inputProps={{ min: 0, step: 0.01 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={line.unit_cost}
                                onChange={(e) => updateLine(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                                sx={{ width: 100 }}
                                inputProps={{ min: 0, step: 0.01 }}
                              />
                            </TableCell>
                            <TableCell>{formatCurrency(line.total_cost)}</TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => removeLine(index)}
                                disabled={lines.length === 1}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Total Cost */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" color="error.main">
                        Total Cost: {formatCurrency(calculateTotalCost())}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        This amount represents the loss to your business
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" color="error">
              Record Damage
            </Button>
          </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default DamageTrackingScreen;