import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import * as salonApi from '../../../services/salonApi';

interface LowStockProduct {
  id: number;
  item_name: string;
  current_stock: number;
  reorder_level: number;
  unit: string;
  category_name: string;
}

const LowStockAlert: React.FC = () => {
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log(`⚠️ [LowStockAlert] Loading low stock products`);
      setLoading(true);
      setError('');
      const response = await salonApi.getLowStockProductsAnalytics();
      console.log(`⚠️ [LowStockAlert] API Response:`, response);
      console.log(`⚠️ [LowStockAlert] Response.data:`, response.data);
      
      // Handle different response formats
      let products: LowStockProduct[] = [];
      if (response.data?.success && response.data?.data) {
        products = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        products = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        products = response.data.data;
      }
      
      console.log(`⚠️ [LowStockAlert] Loaded ${products.length} low stock products`);
      setProducts(products);
    } catch (err: any) {
      console.error('❌ [LowStockAlert] Error loading data:', err);
      setError(err.response?.data?.message || 'Failed to load low stock products');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (current: number, reorder: number) => {
    if (current === 0) return { label: 'Out of Stock', color: 'error' as const };
    if (current <= reorder * 0.5) return { label: 'Critical', color: 'error' as const };
    if (current <= reorder) return { label: 'Low', color: 'warning' as const };
    return { label: 'Normal', color: 'success' as const };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Low Stock Alert
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {products.length} product(s) need restocking
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Products Requiring Attention
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Product Name</strong></TableCell>
                  <TableCell><strong>Category</strong></TableCell>
                  <TableCell align="right"><strong>Current Stock</strong></TableCell>
                  <TableCell align="right"><strong>Reorder Level</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">All products are well stocked!</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => {
                    const status = getStockStatus(product.current_stock, product.reorder_level);
                    return (
                      <TableRow key={product.id} hover>
                        <TableCell sx={{ fontWeight: 'bold' }}>{product.item_name}</TableCell>
                        <TableCell>{product.category_name || 'N/A'}</TableCell>
                        <TableCell align="right">
                          {product.current_stock.toFixed(2)} {product.unit || 'PCS'}
                        </TableCell>
                        <TableCell align="right">
                          {product.reorder_level.toFixed(2)} {product.unit || 'PCS'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={status.label}
                            color={status.color}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LowStockAlert;

