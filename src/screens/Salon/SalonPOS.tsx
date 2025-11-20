import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Chip,
  IconButton,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import * as salonApi from '../../services/salonApi';
import type { SalonService, SalonUser, SalonProduct, SalonShift } from '../../types';

interface ServiceItem {
  service_id: string;
  service_name: string;
  amount: number;
}

interface ProductItem {
  product_id: string;
  product_name: string;
  quantity_used: number;
  cost: number;
}

const SalonPOS: React.FC = () => {
  const [currentShift, setCurrentShift] = useState<SalonShift | null>(null);
  const [employees, setEmployees] = useState<SalonUser[]>([]);
  const [services, setServices] = useState<SalonService[]>([]);
  const [products, setProducts] = useState<SalonProduct[]>([]);
  
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'card' | 'other'>('cash');
  
  const [productsUsed, setProductsUsed] = useState<ProductItem[]>([]);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [productQuantity, setProductQuantity] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [shiftRes, employeesRes, servicesRes, productsRes] = await Promise.all([
        salonApi.getCurrentShift(),
        salonApi.getSalonUsers(),
        salonApi.getServices(),
        salonApi.getProducts(),
      ]);

      if (shiftRes.data.success && shiftRes.data.data) {
        setCurrentShift(shiftRes.data.data);
      }

      if (employeesRes.data.success) {
        setEmployees(employeesRes.data.data.filter((u: SalonUser) => u.role === 'employee' && u.is_active));
      }

      if (servicesRes.data.success) {
        setServices(servicesRes.data.data);
      }

      if (productsRes.data.success) {
        setProducts(productsRes.data.data);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    }
  };

  const handleAddProduct = () => {
    if (!selectedProduct || !productQuantity) {
      setError('Please select product and quantity');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const quantity = parseFloat(productQuantity);
    const cost = quantity * product.unit_cost;

    setProductsUsed([
      ...productsUsed,
      {
        product_id: product.id,
        product_name: product.name,
        quantity_used: quantity,
        cost,
      },
    ]);

    setSelectedProduct('');
    setProductQuantity('');
    setShowProductDialog(false);
  };

  const handleRemoveProduct = (index: number) => {
    setProductsUsed(productsUsed.filter((_, i) => i !== index));
  };

  const handleRecordService = async () => {
    if (!currentShift) {
      setError('No active shift. Please start a shift first.');
      return;
    }

    if (!selectedEmployee || !selectedService) {
      setError('Please select employee and service');
      return;
    }

    const service = services.find(s => s.id === selectedService);
    if (!service) return;

    const amount = customAmount ? parseFloat(customAmount) : service.base_price;

    if (!amount || amount <= 0) {
      setError('Invalid amount');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = {
        shift_id: currentShift.id,
        employee_id: selectedEmployee,
        service_id: selectedService,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        amount_paid: amount,
        payment_method: paymentMethod,
        products_used: productsUsed.length > 0 ? productsUsed : undefined,
      };

      const response = await salonApi.recordTransaction(data);

      if (response.data.success) {
        setSuccess('Service recorded successfully!');
        // Reset form
        setSelectedEmployee('');
        setSelectedService('');
        setCustomAmount('');
        setCustomerName('');
        setCustomerPhone('');
        setPaymentMethod('cash');
        setProductsUsed([]);

        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      console.error('Error recording service:', err);
      setError(err.response?.data?.message || 'Failed to record service');
    } finally {
      setLoading(false);
    }
  };

  if (!currentShift) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          No active shift found. Please start a shift from the dashboard to record services.
        </Alert>
      </Box>
    );
  }

  const selectedServiceData = services.find(s => s.id === selectedService);
  const amount = customAmount ? parseFloat(customAmount) : (selectedServiceData?.base_price || 0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Record Service
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* Left: Service Details */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Service Details
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Employee/Barber *</InputLabel>
                    <Select
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      label="Employee/Barber *"
                    >
                      {employees.map((emp) => (
                        <MenuItem key={emp.id} value={emp.user_id}>
                          {emp.name} ({emp.commission_rate}% commission)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Service *</InputLabel>
                    <Select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      label="Service *"
                    >
                      {services.map((srv) => (
                        <MenuItem key={srv.id} value={srv.id}>
                          {srv.name} - KES {srv.base_price}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Customer Name (Optional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Customer Phone (Optional)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Custom Amount (Optional)"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder={selectedServiceData ? `Default: ${selectedServiceData.base_price}` : ''}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Method *</InputLabel>
                    <Select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      label="Payment Method *"
                    >
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="mpesa">M-Pesa</MenuItem>
                      <MenuItem value="card">Card</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Products Used */}
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Products Used
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Add />}
                      onClick={() => setShowProductDialog(true)}
                    >
                      Add Product
                    </Button>
                  </Box>

                  {productsUsed.length === 0 ? (
                    <Typography color="text.secondary" variant="body2">
                      No products added
                    </Typography>
                  ) : (
                    <Table size="small">
                      <TableBody>
                        {productsUsed.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.product_name}</TableCell>
                            <TableCell align="center">{item.quantity_used}</TableCell>
                            <TableCell align="right">KES {item.cost.toFixed(2)}</TableCell>
                            <TableCell align="right">
                              <IconButton size="small" onClick={() => handleRemoveProduct(index)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Summary */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Summary
              </Typography>

              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Service</TableCell>
                    <TableCell align="right">
                      {selectedServiceData?.name || '-'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell align="right">
                      {employees.find(e => e.user_id === selectedEmployee)?.name || '-'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Payment</TableCell>
                    <TableCell align="right">
                      <Chip label={paymentMethod.toUpperCase()} size="small" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Amount</strong></TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" color="primary.main">
                        KES {amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleRecordService}
                disabled={loading || !selectedEmployee || !selectedService}
                sx={{ mt: 3 }}
              >
                {loading ? 'Recording...' : 'Complete Service'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Product Dialog */}
      <Dialog open={showProductDialog} onClose={() => setShowProductDialog(false)}>
        <DialogTitle>Add Product Used</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, minWidth: 300 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Product</InputLabel>
              <Select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                label="Product"
              >
                {products.map((prod) => (
                  <MenuItem key={prod.id} value={prod.id}>
                    {prod.name} ({prod.current_stock} {prod.unit} available)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              type="number"
              label="Quantity Used"
              value={productQuantity}
              onChange={(e) => setProductQuantity(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowProductDialog(false)}>Cancel</Button>
          <Button onClick={handleAddProduct} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalonPOS;
