import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Divider,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Description as QuoteIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ApiService } from '../services/api';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface Item {
  id: number;
  item_name: string;
  description: string;
  unit_price: number;
  quantity: number;
  category: string;
  uom: string;
  code: string;
}

interface QuotationLine {
  item_id: number | null;
  quantity: number;
  unit_price: number;
  total: number;
  description: string;
  code: string;
  uom: string;
  item_name?: string;
}

const CreateQuotationScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditing = !!editId;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loadingQuotation, setLoadingQuotation] = useState(false);
  
  // Quotation form data
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPin, setCustomerPin] = useState('');
  const [validUntil, setValidUntil] = useState<Date | null>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  );
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<QuotationLine[]>([
    {
      item_id: null,
      quantity: 1,
      unit_price: 0,
      total: 0,
      description: '',
      code: '',
      uom: '',
      item_name: ''
    }
  ]);

  // Fetch items for selection
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await ApiService.getItems();
        if (response.success) {
          setItems(response.data.items || response.data || []);
        }
      } catch (err) {
        console.error('Error fetching items:', err);
      }
    };

    fetchItems();
  }, []);

  // Load quotation data for editing
  useEffect(() => {
    if (isEditing && editId) {
      const loadQuotation = async () => {
        try {
          setLoadingQuotation(true);
          const response = await ApiService.getQuotation(parseInt(editId));
          
          if (response.success) {
            const quotation = response.data;
            setCustomerName(quotation.customer_name);
            setCustomerAddress(quotation.customer_address || '');
            setCustomerPin(quotation.customer_pin || '');
            setValidUntil(new Date(quotation.valid_until));
            setNotes(quotation.notes || '');
            
            // Map quotation lines
            if (quotation.lines && quotation.lines.length > 0) {
              setLines(quotation.lines.map((line: any) => ({
                item_id: line.item_id,
                quantity: line.quantity,
                unit_price: line.unit_price,
                total: line.total,
                description: line.description,
                code: line.code,
                uom: line.uom
              })));
            }
          }
        } catch (err: any) {
          setError(err.message || 'Failed to load quotation');
        } finally {
          setLoadingQuotation(false);
        }
      };
      
      loadQuotation();
    }
  }, [isEditing, editId]);

  const handleItemSelect = (index: number, item: Item | null) => {
    const newLines = [...lines];
    newLines[index] = {
      ...newLines[index],
      item_id: item?.id || null,
      item_name: item?.item_name || '',
      description: item?.description || '',
      unit_price: item?.unit_price || 0,
      code: item?.code || '',
      uom: item?.uom || '',
      total: newLines[index].quantity * (item?.unit_price || 0)
    };
    setLines(newLines);
  };

  const handleLineChange = (index: number, field: keyof QuotationLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_price') {
      newLines[index].total = newLines[index].quantity * newLines[index].unit_price;
    }
    
    setLines(newLines);
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        item_id: null,
        quantity: 1,
        unit_price: 0,
        total: 0,
        description: '',
        code: '',
        uom: '',
        item_name: ''
      }
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
    const vatAmount = subtotal * 0.16;
    const totalAmount = subtotal + vatAmount;
    
    return { subtotal, vatAmount, totalAmount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName || !validUntil || lines.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate that all lines have items and quantities
    const invalidLines = lines.some(line => !line.item_id || line.quantity <= 0);
    if (invalidLines) {
      setError('Please ensure all lines have valid items and quantities');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const quotationData = {
        customer_name: customerName,
        customer_address: customerAddress,
        customer_pin: customerPin,
        valid_until: validUntil?.toISOString() || '',
        notes,
        lines: lines.map(line => ({
          item_id: line.item_id || undefined,
          quantity: line.quantity,
          unit_price: line.unit_price,
          description: line.description,
          code: line.code,
          uom: line.uom
        }))
      };

      let response;
      if (isEditing && editId) {
        // Update existing quotation
        response = await fetch(`/api/quotations/${editId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(quotationData),
        });
      } else {
        // Create new quotation
        response = await ApiService.createQuotation(quotationData);
      }

      let data;
      if (isEditing) {
        if (response.ok) {
          data = await response.json();
          setSuccess('Quotation updated successfully!');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update quotation');
        }
      } else {
        if (response.success) {
          data = response.data;
          setSuccess('Quotation created successfully!');
        } else {
          throw new Error(response.message || 'Failed to create quotation');
        }
      }
      
      // Navigate to quotation list after a short delay
      setTimeout(() => {
        navigate('/quotations');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, vatAmount, totalAmount } = calculateTotals();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  if (loadingQuotation) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading quotation data...</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/quotations')} sx={{ mr: 2 }}>
            <BackIcon />
          </IconButton>
          <QuoteIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            Create Quotation
          </Typography>
        </Box>

        {/* Success Alert */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Customer Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: 1, minWidth: '300px' }}>
                    <TextField
                      fullWidth
                      label="Customer Name *"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: '300px' }}>
                    <TextField
                      fullWidth
                      label="Customer PIN"
                      value={customerPin}
                      onChange={(e) => setCustomerPin(e.target.value)}
                    />
                  </Box>
                </Box>
                <TextField
                  fullWidth
                  label="Customer Address"
                  multiline
                  rows={3}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Quotation Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quotation Details
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ maxWidth: '400px' }}>
                  <DatePicker
                    label="Valid Until *"
                    value={validUntil}
                    onChange={(newValue) => setValidUntil(newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true
                      }
                    }}
                  />
                </Box>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Items */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Items
                </Typography>
                <Button startIcon={<AddIcon />} onClick={addLine}>
                  Add Item
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Unit Price</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell width={50}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lines.map((line, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ minWidth: 300 }}>
                          <Autocomplete
                            options={items}
                            getOptionLabel={(option) => `${option.item_name} (${option.code})`}
                            value={items.find(item => item.id === line.item_id) || null}
                            onChange={(_, newValue) => handleItemSelect(index, newValue)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Select Item"
                                size="small"
                                required
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={line.quantity}
                            onChange={(e) => handleLineChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            inputProps={{ min: 0.01, step: 0.01 }}
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={line.unit_price}
                            onChange={(e) => handleLineChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            inputProps={{ min: 0, step: 0.01 }}
                            sx={{ width: 120 }}
                          />
                        </TableCell>
                        <TableCell>
                          {formatCurrency(line.total)}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => removeLine(index)}
                            disabled={lines.length === 1}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <Box sx={{ maxWidth: 400, ml: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Subtotal:</Typography>
                  <Typography>{formatCurrency(subtotal)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>VAT (16%):</Typography>
                  <Typography>{formatCurrency(vatAmount)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6">{formatCurrency(totalAmount)}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              startIcon={<SaveIcon />}
              disabled={loading || loadingQuotation || lines.length === 0 || !customerName || !validUntil}
            >
              {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Quotation' : 'Create Quotation')}
            </Button>
          </Box>
        </form>
      </Box>
    </LocalizationProvider>
  );
};

export default CreateQuotationScreen;