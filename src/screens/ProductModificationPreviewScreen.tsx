import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Avatar,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import ApiService from '../services/api';

interface BusinessSettings {
  businessName: string;
  street: string;
  city: string;
  email: string;
  telephone: string;
  logo: string;
}

interface ProductModification {
  id: number;
  item_id: number;
  modification_number: string;
  item_name: string;
  item_code: string;
  modified_by: number;
  first_name: string;
  last_name: string;
  old_item_name: string;
  old_description: string;
  old_quantity: number;
  old_unit_price: number;
  old_unit: string;
  old_category_id: number;
  old_category_1_id: number;
  old_category_2_id: number;
  new_item_name: string;
  new_description: string;
  new_quantity: number;
  new_unit_price: number;
  new_unit: string;
  new_category_id: number;
  new_category_1_id: number;
  new_category_2_id: number;
  modification_reason: string;
  created_at: string;
}

const ProductModificationPreviewScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [modification, setModification] = useState<ProductModification | null>(null);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    businessName: 'Your Business Name',
    street: 'Business Address Line 1',
    city: 'Business Address Line 2',
    email: 'business@example.com',
    telephone: '+254 XXX XXX XXX',
    logo: '',
  });
  const documentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadModification(parseInt(id));
    }
    loadBusinessSettings();
  }, [id]);

  const loadModification = async (modId: number) => {
    try {
      setLoading(true);
      const response = await ApiService.getProductModification(modId);
      if (response.success && response.data) {
        setModification(response.data);
      } else {
        setError('Failed to load product modification');
      }
    } catch (err) {
      console.error('Error loading modification:', err);
      setError('Failed to load product modification');
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessSettings = async () => {
    try {
      const response = await ApiService.getBusinessSettings();
      if (response && response.success && response.data) {
        setBusinessSettings(response.data);
        return;
      }
    } catch (error) {
      console.error('Error loading business settings:', error);
    }
    
    const savedSettings = localStorage.getItem('businessSettings');
    if (savedSettings) {
      setBusinessSettings(JSON.parse(savedSettings));
    }
  };

  const generatePdf = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      if (!documentRef.current) {
        throw new Error('Document content not found');
      }

      const canvas = await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        height: documentRef.current.scrollHeight,
        width: documentRef.current.scrollWidth,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `Product_Modification_${modification?.modification_number || 'Document'}.pdf`;
      saveAs(pdf.output('blob'), fileName);
      
    } catch (error: any) {
      console.error('PDF generation error:', error);
      setError('Failed to generate PDF: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!modification) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Product modification not found</Alert>
        <Button onClick={() => navigate('/items-list')} sx={{ mt: 2 }}>
          Back to Items
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      p: 2,
      overflowX: 'auto'
    }}>
      <Box sx={{ 
        width: '100%',
        maxWidth: '900px'
      }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <div ref={documentRef} style={{ 
          backgroundColor: 'white', 
          padding: '40px', 
          minHeight: '600px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Box sx={{ mb: 4, borderBottom: '3px solid #1976d2', pb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2, flexWrap: 'wrap' }}>
                  {businessSettings.logo && (
                    <Avatar
                      src={businessSettings.logo}
                      variant="rounded"
                      sx={{ width: 120, height: 120, border: '2px solid #e0e0e0', borderRadius: '8px' }}
                    />
                  )}
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: '2rem' }}>
                    {businessSettings.businessName}
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6, fontSize: '0.9rem' }}>
                  {businessSettings.street && `${businessSettings.street}, `}
                  {businessSettings.city && `${businessSettings.city}`}
                  <br />
                  Phone No.: {businessSettings.telephone}
                  <br />
                  Email: {businessSettings.email}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right', minWidth: 200 }}>
                <Typography variant="h2" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
                  PRODUCT MODIFICATION
                </Typography>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body1" sx={{ mb: 0.5 }}>
                    <strong>No:</strong> {modification.modification_number}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Date:</strong> {currentDate}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>
              PRODUCT INFORMATION
            </Typography>
            <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Item:</strong> {modification.item_name} ({modification.item_code})
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Modified by: {modification.first_name} {modification.last_name}
              </Typography>
              {modification.modification_reason && (
                <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                  <strong>Reason:</strong> {modification.modification_reason}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>
              MODIFICATION DETAILS
            </Typography>
            
            <Table sx={{ border: '2px solid #1976d2' }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#1976d2' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '14px', py: 2 }}>FIELD</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '14px', py: 2 }}>OLD VALUE</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '14px', py: 2 }}>NEW VALUE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {modification.old_item_name !== modification.new_item_name && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Item Name</TableCell>
                    <TableCell>{modification.old_item_name || '-'}</TableCell>
                    <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>{modification.new_item_name || '-'}</TableCell>
                  </TableRow>
                )}
                {modification.old_description !== modification.new_description && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                    <TableCell>{modification.old_description || '-'}</TableCell>
                    <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>{modification.new_description || '-'}</TableCell>
                  </TableRow>
                )}
                {modification.old_quantity !== modification.new_quantity && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                    <TableCell>{modification.old_quantity || 0}</TableCell>
                    <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>{modification.new_quantity || 0}</TableCell>
                  </TableRow>
                )}
                {modification.old_unit_price !== modification.new_unit_price && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Unit Price</TableCell>
                    <TableCell>KSH {modification.old_unit_price?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>KSH {modification.new_unit_price?.toFixed(2) || '0.00'}</TableCell>
                  </TableRow>
                )}
                {modification.old_unit !== modification.new_unit && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Unit</TableCell>
                    <TableCell>{modification.old_unit || '-'}</TableCell>
                    <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>{modification.new_unit || '-'}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>

          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #ddd', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              This document was generated on {currentDate}
            </Typography>
          </Box>
        </div>

        <Card sx={{ elevation: 4, mt: 3, mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2, flexWrap: 'wrap' }}>
              <Button 
                variant="outlined" 
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/items-list')}
                disabled={isGenerating}
                size="large"
              >
                Back to Items
              </Button>
              <Button 
                variant="contained" 
                startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <PdfIcon />}
                onClick={generatePdf}
                disabled={isGenerating}
                size="large"
              >
                {isGenerating ? 'Generating PDF...' : 'Generate PDF'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ProductModificationPreviewScreen;

