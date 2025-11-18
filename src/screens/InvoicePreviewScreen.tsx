import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Share as ShareIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import type { InvoiceLine } from '../types';

interface BusinessSettings {
  businessName: string;
  street: string;
  city: string;
  email: string;
  telephone: string;
  createdBy: string;
  approvedBy: string;
  createdBySignature: string;
  approvedBySignature: string;
  logo: string;
}

interface LocationState {
  lines: InvoiceLine[];
  customerName: string;
  customerAddress?: string;
  customerPin?: string;
  documentType?: 'invoice' | 'quotation';
  dueDate?: string;
  validUntil?: string;
  paymentTerms?: string;
  notes?: string;
  invoiceNumber?: string;
}

const InvoicePreviewScreen: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareMenuAnchor, setShareMenuAnchor] = useState<null | HTMLElement>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPin, setCustomerPin] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days');
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    businessName: 'Your Business Name',
    street: 'Business Address Line 1',
    city: 'Business Address Line 2',
    email: 'business@example.com',
    telephone: '+254 XXX XXX XXX',
    createdBy: 'Created By Name',
    approvedBy: 'Approved By Name',
    createdBySignature: '',
    approvedBySignature: '',
    logo: '',
  });
  const invoiceRef = useRef<HTMLDivElement>(null);

  const state = location.state as LocationState;
  const documentType = state?.documentType || 'invoice';
  const isQuotation = documentType === 'quotation';
  const isInvoice = documentType === 'invoice';
  
  // If viewing from invoice list (URL param), load invoice from database
  useEffect(() => {
    if (id && !state) {
      loadDocumentFromDatabase(parseInt(id));
    }
  }, [id, state]);

  const loadDocumentFromDatabase = async (docId: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Determine if we're loading a quotation or invoice based on current route
      const isQuotationRoute = window.location.pathname.includes('/quotations/');
      const endpoint = isQuotationRoute ? '/quotations' : '/invoices';
      
      const response = await fetch(`https://erp-backend-beryl.vercel.app/api${endpoint}/${docId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load ${isQuotationRoute ? 'quotation' : 'invoice'}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        const doc = data.data;
        setCustomerName(doc.customer_name || '');
        setCustomerAddress(doc.customer_address || '');
        setCustomerPin(doc.customer_pin || '');
        
        if (isQuotationRoute) {
          setInvoiceNumber(doc.quotation_number || '');
          setDueDate(doc.valid_until || '');
        } else {
          setInvoiceNumber(doc.invoice_number || '');
          setDueDate(doc.due_date || '');
        }
        
        setPaymentTerms(doc.payment_terms || 'Net 30 Days');
        
        // Convert line items and ensure numeric fields are numbers
        const convertedLines = (doc.lines || []).map((line: any) => ({
          ...line,
          quantity: parseFloat(line.quantity) || 0,
          unit_price: parseFloat(line.unit_price) || 0,
          total: parseFloat(line.total) || 0,
        }));
        setLines(convertedLines);
      }
    } catch (err) {
      console.error('Error loading document:', err);
      setError('Failed to load document details. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // If no state and no id, redirect
  if (!state && !id) {
    navigate('/create-invoice');
    return null;
  }

  // Use state data if available, otherwise use loaded data
  const displayLines = state?.lines || lines;
  const displayCustomerName = state?.customerName || customerName;
  const displayCustomerAddress = state?.customerAddress || customerAddress;
  const displayCustomerPin = state?.customerPin || customerPin;

  useEffect(() => {
    loadBusinessSettings();
    // Set invoice number from state if provided
    if (state?.invoiceNumber) {
      setInvoiceNumber(state.invoiceNumber);
    }
  }, [state?.invoiceNumber, state, id]);

  const loadBusinessSettings = async () => {
    try {
      const response = await fetch('https://erp-backend-beryl.vercel.app/api/business-settings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setBusinessSettings(data.data);
          return;
        }
      }
    } catch (error) {
      console.error('Error loading business settings:', error);
    }
    
    // Fallback to localStorage for backward compatibility
    const savedSettings = localStorage.getItem('businessSettings');
    if (savedSettings) {
      setBusinessSettings(JSON.parse(savedSettings));
    }
  };

  // Filter out any empty or invalid items
  const validItems = displayLines.filter(line => 
    line && 
    line.description && 
    line.description.trim() !== '' && 
    line.quantity > 0
  );

  // Calculate totals
  const subtotal = validItems.reduce((sum: number, line: InvoiceLine) => sum + (line.quantity * line.unit_price || 0), 0);
  const vat = subtotal * 0.16;
  const total = subtotal + vat;

  // Generate quotation number and date
  const quotationNo = `QT-${Date.now()}`;
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const generatePdf = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      if (!invoiceRef.current) {
        throw new Error('Document content not found');
      }

      // Generate canvas from the document content
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        height: invoiceRef.current.scrollHeight,
        width: invoiceRef.current.scrollWidth,
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename based on document type
      const docType = isQuotation ? 'Quotation' : 'Invoice';
      const docNumber = isQuotation ? quotationNo : (invoiceNumber || 'Draft');
      const fileName = `${docType}_${docNumber}_${displayCustomerName?.replace(/\s+/g, '_') || 'Document'}.pdf`;
      
      // Save the PDF to device
      saveAs(pdf.output('blob'), fileName);
      
    } catch (error: any) {
      console.error('PDF generation error:', error);
      setError('Failed to generate PDF: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePdfBlob = async (): Promise<Blob | null> => {
    try {
      if (!invoiceRef.current) {
        throw new Error('Invoice content not found');
      }

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        height: invoiceRef.current.scrollHeight,
        width: invoiceRef.current.scrollWidth,
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

      return pdf.output('blob');
    } catch (error) {
      console.error('PDF blob generation error:', error);
      return null;
    }
  };

  const shareViaWhatsApp = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      const docType = isQuotation ? 'QUOTATION' : 'INVOICE';
      const docNumber = isQuotation ? quotationNo : (invoiceNumber || 'PENDING');
      
      // Create a text message with document details
      const message = `*${docType}*
Document No: ${docNumber}
Date: ${currentDate}
Customer: ${state?.customerName}

*Items:*
${validItems.map((item, index) => 
  `${index + 1}. ${item.description} - Qty: ${item.quantity} - KSH ${(item.quantity * item.unit_price).toFixed(2)}`
).join('\n')}

Subtotal: KSH ${subtotal.toFixed(2)}
VAT (16%): KSH ${vat.toFixed(2)}
*Total: KSH ${total.toFixed(2)}*

Thank you for your business!`;

      // Open WhatsApp Web with the message
      const whatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      setShareMenuAnchor(null);
    } catch (error: any) {
      setError('Failed to share via WhatsApp');
    } finally {
      setIsGenerating(false);
    }
  };

  const shareViaEmail = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      const docType = isQuotation ? 'Quotation' : 'Invoice';
      const docNumber = isQuotation ? quotationNo : (invoiceNumber || 'PENDING');
      const subject = `${docType} ${docNumber} - ${displayCustomerName}`;
      const body = `Dear ${displayCustomerName},

Please find below your ${docType.toLowerCase()} details:

${docType} No: ${docNumber}
Date: ${currentDate}

Items:
${validItems.map((item, index) => 
  `${index + 1}. ${item.description} - Qty: ${item.quantity} - Unit Price: KSH ${item.unit_price.toFixed(2)} - Total: KSH ${(item.quantity * item.unit_price).toFixed(2)}`
).join('\n')}

Subtotal: KSH ${subtotal.toFixed(2)}
VAT (16%): KSH ${vat.toFixed(2)}
Total: KSH ${total.toFixed(2)}

Thank you for your business!

Best regards,
Your Business Name`;

      const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoUrl;
      
      setShareMenuAnchor(null);
    } catch (error: any) {
      setError('Failed to open email client');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setShareMenuAnchor(event.currentTarget);
  };

  const handleShareClose = () => {
    setShareMenuAnchor(null);
  };



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

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && (
        <>
        {/* Invoice Content - This will be captured for PDF */}
        <div ref={invoiceRef} style={{ 
          backgroundColor: 'white', 
          padding: '40px', 
          minHeight: '800px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
        {/* Company Header */}
        <Box sx={{ mb: 4, borderBottom: '3px solid #1976d2', pb: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2, flexWrap: 'wrap' }}>
                {businessSettings.logo && (
                  <Avatar
                    src={businessSettings.logo}
                    variant="rounded"
                    sx={{ width: 100, height: 50, border: '1px solid #ddd' }}
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
                Tel: {businessSettings.telephone}
                <br />
                Email: {businessSettings.email}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right', minWidth: 200 }}>
              <Typography variant="h2" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
                {isQuotation ? 'QUOTATION' : 'INVOICE'}
              </Typography>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body1" sx={{ mb: 0.5 }}>
                  <strong>No:</strong> {isQuotation ? quotationNo : (invoiceNumber || 'TBD')}
                </Typography>
                <Typography variant="body1">
                  <strong>Date:</strong> {currentDate}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Customer Information */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>
                BILL TO:
              </Typography>
              <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {displayCustomerName}
                </Typography>
                {displayCustomerAddress && (
                  <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                    {displayCustomerAddress}
                  </Typography>
                )}
                {displayCustomerPin && (
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    PIN: {displayCustomerPin}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>
                {isQuotation ? 'QUOTATION DETAILS:' : 'INVOICE DETAILS:'}
              </Typography>
              <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                {isQuotation && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Valid Until:</strong> {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}
                  </Typography>
                )}
                {isInvoice && dueDate && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Due Date:</strong> {new Date(dueDate).toLocaleDateString('en-GB')}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Payment Terms:</strong> {paymentTerms}
                </Typography>
                <Typography variant="body2">
                  <strong>Currency:</strong> KSH (Kenyan Shilling)
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Items Table */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>
            ITEMS & SERVICES
          </Typography>
          
          <Table sx={{ border: '2px solid #1976d2' }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#1976d2' }}>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', fontSize: '14px', py: 2 }}>NO.</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '14px', py: 2 }}>ITEM CODE</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '14px', py: 2 }}>DESCRIPTION</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', fontSize: '14px', py: 2 }}>QTY</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', fontSize: '14px', py: 2 }}>UOM</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold', fontSize: '14px', py: 2 }}>UNIT PRICE</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold', fontSize: '14px', py: 2 }}>TOTAL</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {validItems.map((item, index) => (
                <TableRow key={index} sx={{ '&:nth-of-type(even)': { backgroundColor: '#f9f9f9' } }}>
                  <TableCell align="center" sx={{ fontSize: '13px', py: 1.5, border: '1px solid #ddd' }}>
                    {index + 1}
                  </TableCell>
                  <TableCell sx={{ fontSize: '13px', py: 1.5, border: '1px solid #ddd' }}>
                    {item.code}
                  </TableCell>
                  <TableCell sx={{ fontSize: '13px', py: 1.5, border: '1px solid #ddd' }}>
                    {item.description}
                  </TableCell>
                  <TableCell align="center" sx={{ fontSize: '13px', py: 1.5, border: '1px solid #ddd' }}>
                    {item.quantity}
                  </TableCell>
                  <TableCell align="center" sx={{ fontSize: '13px', py: 1.5, border: '1px solid #ddd' }}>
                    {item.uom}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: '13px', py: 1.5, border: '1px solid #ddd' }}>
                    {item.unit_price.toFixed(2)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: '13px', py: 1.5, border: '1px solid #ddd', fontWeight: 'bold' }}>
                    {(item.quantity * item.unit_price).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              
              {validItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, border: '1px solid #ddd' }}>
                    <Typography variant="body2" color="text.secondary">
                      No valid items to display
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        {/* Totals Section */}
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4, mb: 4 }}>
          <Box sx={{ flex: 1 }}>
            {/* Terms and Conditions */}
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>
              TERMS & CONDITIONS:
            </Typography>
            <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.6 }}>
                • Goods remain the property of the supplier until paid in full.
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.6 }}>
                • Late payments may incur additional charges
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.6 }}>
                • All prices are in Kenyan Shillings (KSH)
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                • This quotation is valid for 30 days
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>
              SUMMARY:
            </Typography>
            <Box sx={{ border: '2px solid #1976d2', borderRadius: 1, overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, borderBottom: '1px solid #ddd' }}>
                <Typography variant="body1">SUB TOTAL:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  KSH {subtotal.toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, borderBottom: '1px solid #ddd' }}>
                <Typography variant="body1">V.A.T (16%):</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  KSH {vat.toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                p: 2, 
                backgroundColor: '#1976d2',
                color: 'white'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>TOTAL:</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  KSH {total.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Signatures Section */}
        <Box sx={{ mt: 6, pt: 4, borderTop: '2px solid #ddd' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 3 }}>
            AUTHORIZATION:
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 6 }}>
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 'bold' }}>
                CREATED BY:
              </Typography>
              
              {businessSettings.createdBySignature ? (
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                  <Avatar
                    src={businessSettings.createdBySignature}
                    variant="rounded"
                    sx={{ width: 120, height: 48 }}
                  />
                </Box>
              ) : (
                <Box sx={{ height: 60, border: '1px solid #ddd', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No signature
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ borderTop: '1px solid #333', pt: 1, mx: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {businessSettings.createdBy || 'Created By Name'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Date: {currentDate}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 'bold' }}>
                APPROVED BY:
              </Typography>
              
              {businessSettings.approvedBySignature ? (
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                  <Avatar
                    src={businessSettings.approvedBySignature}
                    variant="rounded"
                    sx={{ width: 120, height: 48 }}
                  />
                </Box>
              ) : (
                <Box sx={{ height: 60, border: '1px solid #ddd', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No signature
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ borderTop: '1px solid #333', pt: 1, mx: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {businessSettings.approvedBy || 'Approved By Name'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Date: {currentDate}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #ddd', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Thank you for your business! For any queries, please contact us at {businessSettings.email} or {businessSettings.telephone}
          </Typography>
        </Box>
      </div>

      {/* Action Buttons - Outside of PDF capture area */}
      <Card sx={{ elevation: 4, mt: 3, mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <PdfIcon />}
              onClick={generatePdf}
              disabled={isGenerating}
              size="large"
            >
              {isGenerating ? 'Generating PDF...' : 'Generate PDF'}
            </Button>
            
            <Button 
              variant="outlined" 
              startIcon={<ShareIcon />}
              onClick={handleShareClick}
              disabled={isGenerating}
              size="large"
            >
              Share
            </Button>

            <Button 
              variant="outlined" 
              startIcon={<SettingsIcon />}
              onClick={() => navigate('/business-settings')}
              disabled={isGenerating}
              size="large"
              color="secondary"
            >
              Settings
            </Button>
          </Box>
          
          <Typography variant="body2" color="text.secondary" align="center">
            Total items: {validItems.length} | Subtotal: KSH {subtotal.toFixed(2)} | Total: KSH {total.toFixed(2)}
          </Typography>
          
          <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 1 }}>
            Configure business details and signatures in Settings
          </Typography>
        </CardContent>
      </Card>

      {/* Share Menu */}
      <Menu
        anchorEl={shareMenuAnchor}
        open={Boolean(shareMenuAnchor)}
        onClose={handleShareClose}
        PaperProps={{
          elevation: 8,
          sx: {
            mt: 1.5,
            minWidth: 180,
          },
        }}
      >
        <MenuItem onClick={shareViaWhatsApp} disabled={isGenerating}>
          <ListItemIcon>
            <WhatsAppIcon color="success" />
          </ListItemIcon>
          <ListItemText>WhatsApp</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={shareViaEmail} disabled={isGenerating}>
          <ListItemIcon>
            <EmailIcon color="primary" />
          </ListItemIcon>
          <ListItemText>Email</ListItemText>
        </MenuItem>
      </Menu>
      </>
      )}
      </Box>
    </Box>
  );
};

export default InvoicePreviewScreen;