import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  LinearProgress
} from '@mui/material';

interface QuotationAnalysisProps {
  dateRange: string;
}

interface QuotationStats {
  totalQuotations: number;
  convertedQuotations: number;
  pendingQuotations: number;
  rejectedQuotations: number;
  conversionRate: number;
  averageValue: number;
  totalValue: number;
}

interface QuotationItem {
  id: number;
  quotationNumber: string;
  customerName: string;
  amount: number;
  status: 'Pending' | 'Converted' | 'Rejected';
  createdAt: string;
  validUntil: string;
}

const QuotationAnalysis: React.FC<QuotationAnalysisProps> = ({ dateRange }) => {
  const [stats, setStats] = useState<QuotationStats | null>(null);
  const [quotations, setQuotations] = useState<QuotationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotationAnalysis();
  }, [dateRange]);

  const fetchQuotationAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/quotation-analysis', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch quotation analysis');
      }
      
      const data = await response.json();
      setStats(data.stats);
      setQuotations(data.quotations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Converted': return 'success';
      case 'Pending': return 'warning';
      case 'Rejected': return 'error';
      default: return 'default';
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

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Quotation Analysis
      </Typography>
      
      <Box display="flex" gap={3} flexDirection={{ xs: 'column', md: 'row' }}>
        <Box flex={1}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Conversion Statistics
              </Typography>
              {stats && (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="body2">Conversion Rate</Typography>
                    <Typography variant="h6" color="primary">
                      {stats.conversionRate.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.conversionRate} 
                    sx={{ mb: 2 }}
                  />
                  
                  <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="body2">Total Quotations</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stats.totalQuotations}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="body2">Converted</Typography>
                    <Typography variant="body2" color="success.main" fontWeight="bold">
                      {stats.convertedQuotations}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="body2">Pending</Typography>
                    <Typography variant="body2" color="warning.main" fontWeight="bold">
                      {stats.pendingQuotations}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Rejected</Typography>
                    <Typography variant="body2" color="error.main" fontWeight="bold">
                      {stats.rejectedQuotations}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
        
        <Box flex={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Quotations
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Quotation #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell>Valid Until</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {quotations.slice(0, 10).map((quotation) => (
                      <TableRow key={quotation.id}>
                        <TableCell>{quotation.quotationNumber}</TableCell>
                        <TableCell>{quotation.customerName}</TableCell>
                        <TableCell align="right">
                          ${quotation.amount.toLocaleString()}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={quotation.status}
                            color={getStatusColor(quotation.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(quotation.validUntil).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default QuotationAnalysis;