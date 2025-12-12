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
} from '@mui/material';
import * as salonApi from '../../../services/salonApi';

interface ProductSalesAnalyticsProps {
  filter: 'day' | 'week' | 'month';
}

interface Product {
  item_id: number;
  item_name: string;
  unit: string;
  total_quantity: number;
  total_revenue: number;
  avg_price: number;
  invoice_count: number;
}

const ProductSalesAnalytics: React.FC<ProductSalesAnalyticsProps> = ({ filter }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      console.log(`📦 [ProductSalesAnalytics] Loading data with filter: ${filter}`);
      setLoading(true);
      setError('');
      const response = await salonApi.getProductSalesAnalytics({ filter });
      console.log(`📦 [ProductSalesAnalytics] API Response:`, response);
      console.log(`📦 [ProductSalesAnalytics] Response.data:`, response.data);
      
      // Handle different response formats
      let products: Product[] = [];
      if (response.data?.success && response.data?.data) {
        products = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        products = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        products = response.data.data;
      }
      
      console.log(`📦 [ProductSalesAnalytics] Loaded ${products.length} products`);
      setProducts(products);
    } catch (err: any) {
      console.error('❌ [ProductSalesAnalytics] Error loading data:', err);
      setError(err.response?.data?.message || 'Failed to load product analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${Number(amount || 0).toFixed(2)}`;
  };

  const totalRevenue = products.reduce((sum, prod) => sum + prod.total_revenue, 0);
  const totalQuantity = products.reduce((sum, prod) => sum + prod.total_quantity, 0);

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

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Total Products Sold</Typography>
            <Typography variant="h4" fontWeight="bold">{products.length}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Total Quantity</Typography>
            <Typography variant="h4" fontWeight="bold">{totalQuantity.toFixed(2)}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              {formatCurrency(totalRevenue)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Product Sales Breakdown
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Product Name</strong></TableCell>
                  <TableCell><strong>Unit</strong></TableCell>
                  <TableCell align="right"><strong>Total Quantity</strong></TableCell>
                  <TableCell align="right"><strong>Avg Price</strong></TableCell>
                  <TableCell align="right"><strong>Total Revenue</strong></TableCell>
                  <TableCell align="center"><strong>Invoices</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No product sales found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.item_id} hover>
                      <TableCell sx={{ fontWeight: 'bold' }}>{product.item_name}</TableCell>
                      <TableCell>{product.unit || 'PCS'}</TableCell>
                      <TableCell align="right">{product.total_quantity.toFixed(2)}</TableCell>
                      <TableCell align="right">{formatCurrency(product.avg_price)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {formatCurrency(product.total_revenue)}
                      </TableCell>
                      <TableCell align="center">{product.invoice_count}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProductSalesAnalytics;

