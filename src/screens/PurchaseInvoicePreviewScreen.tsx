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
import ApiService from '../services/api';

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
  supplierName: string;
  supplierAddress?: string;
  supplierPin?: string;
  documentType?: 'purchase_invoice';
  dueDate?: string;
  paymentTerms?: string;
  notes?: string;
  purchaseInvoiceNumber?: string;
  includeVAT?: boolean;
  vat_amount?: number;
  discount_amount?: number;
  total_amount?: number;
}

const PurchaseInvoicePreviewScreen: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareMenuAnchor, setShareMenuAnchor] = useState<null | HTMLElement>(null);
  const [purchaseInvoiceNumber, setPurchaseInvoiceNumber] = useState<string>('');
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [supplierName, setSupplierName] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierPin, setSupplierPin] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [includeVAT, setIncludeVAT] = useState<boolean>(true);
  const [vatAmount, setVatAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
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
  const documentType = state?.documentType || 'purchase_invoice';
  
  // If viewing from purchase invoice list (URL param), load purchase invoice from database
  useEffect(() => {
    if (id && !state) {
      loadDocumentFromDatabase(parseInt(id));
    }
  }, [id, state]);

  // Redirect if no state and no id - must be in useEffect
  useEffect(() => {
    if (!state && !id && !loading) {
      navigate('/create-purchase-invoice');
    }
  }, [state, id, loading, navigate]);

  const loadDocumentFromDatabase = async (docId: number) => {
    try {
      setLoading(true);
      
      const response = await ApiService.getPurchaseInvoice(docId);

      let doc: any = null;
      if (response.success && response.data) {
        doc = response.data;
      } else if (response.data) {
        doc = response.data;
      } else {
        doc = response;
      }
      
      if (!doc) {
        throw new Error('Failed to load purchase invoice');
      }
      
      setSupplierName(doc.supplier_name || '');
      setSupplierAddress(doc.supplier_address || '');
      setSupplierPin(doc.supplier_pin || '');
      setPurchaseInvoiceNumber(doc.purchase_invoice_number || '');
      setDueDate(doc.due_date || '');
      setPaymentTerms(doc.payment_terms || 'Net 30 Days');
      setAmountPaid(parseFloat(doc.amount_paid || doc.amountPaid || 0) || 0);
      setVatAmount(parseFloat(doc.vat_amount || 0) || 0);
      setDiscountAmount(parseFloat(doc.discount || doc.discount_amount || 0) || 0);
      setTotalAmount(parseFloat(doc.total_amount || 0) || 0);
      setIncludeVAT((parseFloat(doc.vat_amount || 0) || 0) > 0);
      
      const convertedLines = (doc.lines || []).map((line: any) => ({
        ...line,
        quantity: parseFloat(line.quantity) || 0,
        unit_price: parseFloat(line.unit_price) || 0,
        total: parseFloat(line.total) || 0,
      }));
      setLines(convertedLines);
    } catch (err) {
      console.error('Error loading document:', err);
      setError('Failed to load document details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Use state data if available, otherwise use loaded data
  const displayLines = state?.lines || lines;
  const displaySupplierName = state?.supplierName || supplierName;
  const displaySupplierAddress = state?.supplierAddress || supplierAddress;
  const displaySupplierPin = state?.supplierPin || supplierPin;

  // Check if we have data to display (either from state or loaded from database)
  // If we have state, we have data. If we have id and are not loading, check if we have loaded data.
  // If we don't have id or state, check if we have display lines.
  const hasData = state || (id && !loading && supplierName && lines.length > 0) || (!id && !state && displayLines.length > 0);

  useEffect(() => {
    loadBusinessSettings();
    if (state?.purchaseInvoiceNumber) {
      setPurchaseInvoiceNumber(state.purchaseInvoiceNumber);
    }
    if (state?.includeVAT !== undefined) {
      setIncludeVAT(state.includeVAT);
    }
    if (state?.vat_amount !== undefined) {
      setVatAmount(state.vat_amount);
    }
    if (state?.discount_amount !== undefined) {
      setDiscountAmount(state.discount_amount);
    }
    if (state?.total_amount !== undefined) {
      setTotalAmount(state.total_amount);
    }
  }, [state?.purchaseInvoiceNumber, state?.includeVAT, state?.vat_amount, state?.discount_amount, state?.total_amount, state, id]);

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

  const validItems = displayLines.filter(line => 
    line && 
    line.description && 
    line.description.trim() !== '' && 
    line.quantity > 0
  );

  // Calculate totals - use state values if available, otherwise calculate
  const subtotal = validItems.reduce((sum: number, line: InvoiceLine) => sum + (line.quantity * line.unit_price || 0), 0);
  const calculatedVat = state?.vat_amount !== undefined ? state.vat_amount : (includeVAT ? subtotal * 0.16 : 0);
  const calculatedDiscount = state?.discount_amount !== undefined ? state.discount_amount : discountAmount;
  const calculatedTotal = state?.total_amount !== undefined ? state.total_amount : (subtotal + calculatedVat - calculatedDiscount);
  
  // Use calculated values
  const vat = calculatedVat;
  const total = Math.max(0, calculatedTotal);

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

      const docType = 'Purchase_Invoice';
      const docNumber = purchaseInvoiceNumber || 'Draft';
      const fileName = `${docType}_${docNumber}_${displaySupplierName?.replace(/\s+/g, '_') || 'Document'}.pdf`;
      
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
      const docType = 'PURCHASE INVOICE';
      const docNumber = purchaseInvoiceNumber || 'PENDING';
      
      const message = `*${docType}*
Document No: ${docNumber}
Date: ${currentDate}
Supplier: ${state?.supplierName || displaySupplierName}

*Items:*
${validItems.map((item, index) => 
  `${index + 1}. ${item.description} - Qty: ${item.quantity} - KSH ${(item.quantity * item.unit_price).toFixed(2)}`
).join('\n')}

Subtotal: KSH ${subtotal.toFixed(2)}${includeVAT && vat > 0 ? `\nVAT (16%): KSH ${vat.toFixed(2)}` : ''}${calculatedDiscount > 0 ? `\nDiscount: -KSH ${calculatedDiscount.toFixed(2)}` : ''}
*Total: KSH ${total.toFixed(2)}*

Thank you for your business!`;

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
      const docType = 'Purchase Invoice';
      const docNumber = purchaseInvoiceNumber || 'PENDING';
      const subject = `${docType} ${docNumber} - ${displaySupplierName}`;
      const body = `Dear ${displaySupplierName},

Please find below your ${docType.toLowerCase()} details:

${docType} No: ${docNumber}
Date: ${currentDate}

Items:
${validItems.map((item, index) => 
  `${index + 1}. ${item.description} - Qty: ${item.quantity} - Unit Price: KSH ${item.unit_price.toFixed(2)} - Total: KSH ${(item.quantity * item.unit_price).toFixed(2)}`
).join('\n')}

Subtotal: KSH ${subtotal.toFixed(2)}${includeVAT && vat > 0 ? `\nVAT (16%): KSH ${vat.toFixed(2)}` : ''}${calculatedDiscount > 0 ? `\nDiscount: -KSH ${calculatedDiscount.toFixed(2)}` : ''}
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

        {(loading || !hasData) && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && hasData && (
        <>
        <div ref={invoiceRef} style={{ 
          backgroundColor: 'white', 
          padding: '40px', 
          minHeight: '800px',
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
                PURCHASE INVOICE
              </Typography>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body1" sx={{ mb: 0.5 }}>
                  <strong>No:</strong> {purchaseInvoiceNumber || 'TBD'}
                </Typography>
                <Typography variant="body1">
                  <strong>Date:</strong> {currentDate}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>
                SUPPLIER:
              </Typography>
              <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {displaySupplierName}
                </Typography>
                {displaySupplierAddress && (
                  <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                    {displaySupplierAddress}
                  </Typography>
                )}
                {displaySupplierPin && (
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    PIN: {displaySupplierPin}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>
                PURCHASE INVOICE DETAILS:
              </Typography>
              <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Due Date:</strong> {dueDate ? new Date(dueDate).toLocaleDateString('en-GB') : 'N/A'}
                </Typography>
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

        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4, mb: 4 }}>
          <Box sx={{ flex: 1 }}>
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
                • This purchase invoice is valid for 15 days
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
              {includeVAT && vat > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, borderBottom: '1px solid #ddd' }}>
                  <Typography variant="body1">V.A.T (16%):</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    KSH {vat.toFixed(2)}
                  </Typography>
                </Box>
              )}
              {calculatedDiscount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, borderBottom: '1px solid #ddd' }}>
                  <Typography variant="body1" sx={{ color: 'error.main' }}>DISCOUNT:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    -KSH {calculatedDiscount.toFixed(2)}
                  </Typography>
                </Box>
              )}
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
              {amountPaid > 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  p: 2, 
                  borderTop: '1px solid rgba(255,255,255,0.3)',
                  backgroundColor: '#1976d2',
                  color: 'white'
                }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>AMOUNT PAID:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    KSH {amountPaid.toFixed(2)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

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

        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #ddd', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Thank you for your business! For any queries, please contact us at {businessSettings.email} or {businessSettings.telephone}
          </Typography>
        </Box>
      </div>

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

export default PurchaseInvoicePreviewScreen;

