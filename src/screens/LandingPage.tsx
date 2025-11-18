import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
  AppBar,
  Toolbar,
  useMediaQuery,
  useTheme,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Receipt,
  TrendingUp,
  Lightbulb as ZapIcon,
  Shield,
  Group as UsersIcon,
  BarChart,
  Description as FileTextIcon,
  AccessTime as ClockIcon,
  Lock,
  LocalPharmacy as PharmacyIcon,
  ShoppingCart as POSIcon,
  Handshake as ServiceIcon,
  CreditCard as BillingIcon,
} from '@mui/icons-material';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (event.type === 'keydown' && ((event as React.KeyboardEvent).key === 'Tab' || (event as React.KeyboardEvent).key === 'Shift')) {
      return;
    }
    setMobileDrawerOpen(open);
  };

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
  ];

  const pricingPlans = [
    {
      name: 'Standard',
      price: '$29',
      period: '/month',
      description: 'Perfect for small businesses and freelancers',
      features: [
        'Up to 100 invoices/month',
        'Up to 100 quotations/month',
        'Basic analytics',
        'Email support',
        'Single user account',
        'Basic invoice templates',
        'Up to 500 items',
      ],
      icon: FileTextIcon,
      color: '#3B82F6',
      popular: false,
    },
    {
      name: 'Premium',
      price: '$79',
      period: '/month',
      description: 'Ideal for growing businesses',
      features: [
        'Unlimited invoices/quotations',
        'Advanced analytics',
        'Priority email & chat support',
        'Up to 5 team members',
        'Custom templates',
        'Up to 5,000 items',
        'Goods return tracking',
        'Payment reminders',
        'API access',
      ],
      icon: ZapIcon,
      color: '#667eea',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'pricing',
      description: 'For large-scale operations',
      features: [
        'Everything in Premium',
        'Unlimited team members',
        'Dedicated account manager',
        '24/7 phone & email support',
        'Custom integrations',
        'Advanced security features',
        'Multi-currency support',
        'Damage tracking system',
        'Financial accounting module',
        'White-label options',
      ],
      icon: Shield,
      color: '#EC4899',
      popular: false,
    },
  ];

  const features = [
    {
      icon: Receipt,
      title: 'Professional Invoices',
      description: 'Create beautiful, customizable invoices that reflect your brand',
    },
    {
      icon: FileTextIcon,
      title: 'Quotations Management',
      description: 'Generate and track quotations with ease',
    },
    {
      icon: BarChart,
      title: 'Advanced Analytics',
      description: 'Gain insights into your business performance',
    },
    {
      icon: UsersIcon,
      title: 'Team Collaboration',
      description: 'Manage multiple users and delegate tasks',
    },
    {
      icon: TrendingUp,
      title: 'Financial Reports',
      description: 'Track revenue, expenses, and profitability',
    },
    {
      icon: Lock,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security for your data',
    },
    {
      icon: PharmacyIcon,
      title: 'Pharmacy Module',
      description: 'Complete pharmacy management and prescription tracking',
    },
    {
      icon: POSIcon,
      title: 'Point of Sale System',
      description: 'Fast and efficient sales processing with inventory control',
    },
    {
      icon: ServiceIcon,
      title: 'Service Management',
      description: 'Schedule and manage service appointments efficiently',
    },
    {
      icon: BillingIcon,
      title: 'Comprehensive Billing',
      description: 'Flexible billing options and automated payment processing',
    },
  ];

  const PricingCard = ({ plan }: any) => {
    const IconComponent = plan.icon;
    return (
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          border: plan.popular ? `3px solid ${plan.color}` : '1px solid #e5e7eb',
          position: 'relative',
          transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: plan.popular 
              ? `0 25px 50px rgba(0, 0, 0, 0.15)` 
              : '0 10px 25px rgba(0, 0, 0, 0.1)',
          },
          backgroundColor: plan.popular ? 'rgba(139, 92, 246, 0.02)' : '#fff',
        }}
      >
        {plan.popular && (
          <Chip
            label="Most Popular"
            sx={{
              position: 'absolute',
              top: -12,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: plan.color,
              color: 'white',
              fontWeight: 'bold',
            }}
          />
        )}
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconComponent sx={{ fontSize: 40, color: plan.color, mr: 1 }} />
            <Typography variant="h5" fontWeight="bold">
              {plan.name}
            </Typography>
          </Box>

          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {plan.description}
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h3" component="div" fontWeight="bold" sx={{ color: plan.color }}>
              {plan.price}
            </Typography>
            <Typography color="text.secondary">{plan.period}</Typography>
          </Box>

          <Stack spacing={1.5} sx={{ mb: 3, flexGrow: 1 }}>
            {plan.features.map((feature: string, index: number) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <CheckIcon sx={{ fontSize: 20, color: plan.color, mr: 1, mt: 0.5, flexShrink: 0 }} />
                <Typography variant="body2">{feature}</Typography>
              </Box>
            ))}
          </Stack>

          <Button
            fullWidth
            variant={plan.popular ? 'contained' : 'outlined'}
            sx={{
              py: 1.5,
              backgroundColor: plan.popular ? plan.color : 'transparent',
              color: plan.popular ? 'white' : plan.color,
              borderColor: plan.color,
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: plan.popular ? plan.color : `${plan.color}20`,
              },
            }}
            onClick={() => navigate('/register')}
          >
            Get Started
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ width: '100%', overflowX: 'hidden' }}>
      {/* Navigation Bar */}
      <AppBar
        position="sticky"
        sx={{
          backgroundColor: 'white',
          color: '#1f2937',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <Receipt sx={{ fontSize: 32, color: '#667eea' }} />
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#667eea' }}>
              InvoiceHub
            </Typography>
          </Box>

          {!isMobile ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {navItems.map((item) => (
                <Typography
                  key={item.label}
                  component="a"
                  href={item.href}
                  sx={{
                    cursor: 'pointer',
                    textDecoration: 'none',
                    color: '#6b7280',
                    fontWeight: 500,
                    '&:hover': { color: '#667eea' },
                  }}
                >
                  {item.label}
                </Typography>
              ))}
              <Button
                variant="outlined"
                sx={{
                  borderColor: '#667eea',
                  color: '#667eea',
                  fontWeight: 'bold',
                  '&:hover': { backgroundColor: '#f3e8ff' },
                }}
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: '#667eea',
                  fontWeight: 'bold',
                  '&:hover': { backgroundColor: '#5568d3' },
                }}
                onClick={() => navigate('/register')}
              >
                Sign Up
              </Button>
            </Box>
          ) : (
            <>
              <IconButton onClick={toggleDrawer(true)}>
                <MenuIcon sx={{ color: '#667eea' }} />
              </IconButton>
              <Drawer anchor="right" open={mobileDrawerOpen} onClose={toggleDrawer(false)}>
                <Box sx={{ width: 250, pt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, mb: 2 }}>
                    <IconButton onClick={toggleDrawer(false)}>
                      <CloseIcon />
                    </IconButton>
                  </Box>
                  <List>
                    {navItems.map((item) => (
                      <ListItem key={item.label} disablePadding>
                        <ListItemButton component="a" href={item.href}>
                          <ListItemText primary={item.label} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                  <Box sx={{ px: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      sx={{
                        borderColor: '#667eea',
                        color: '#667eea',
                      }}
                      onClick={() => {
                        setMobileDrawerOpen(false);
                        navigate('/login');
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{ backgroundColor: '#667eea' }}
                      onClick={() => {
                        setMobileDrawerOpen(false);
                        navigate('/register');
                      }}
                    >
                      Sign Up
                    </Button>
                  </Box>
                </Box>
              </Drawer>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          py: { xs: 6, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage:
              'radial-gradient(circle at 20% 50%, #fff 0%, transparent 50%), radial-gradient(circle at 80% 80%, #fff 0%, transparent 50%)',
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', px: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 6, alignItems: 'center', width: '100%', maxWidth: '1200px' }}>
            <Box>
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 'bold',
                  mb: 2,
                  fontSize: { xs: '2rem', md: '3.5rem' },
                  lineHeight: 1.2,
                }}
              >
                Professional Invoice Management Made Easy
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  mb: 4,
                  opacity: 0.95,
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  fontWeight: 300,
                }}
              >
                Create stunning invoices and quotations in seconds. Streamline your billing process with our powerful, intuitive platform.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    backgroundColor: 'white',
                    color: '#667eea',
                    fontWeight: 'bold',
                    py: 1.5,
                    px: 4,
                    '&:hover': { backgroundColor: '#f3e8ff' },
                  }}
                  onClick={() => navigate('/register')}
                >
                  Start Free Trial
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    fontWeight: 'bold',
                    py: 1.5,
                    px: 4,
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                  }}
                >
                  Watch Demo
                </Button>
              </Stack>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  height: '400px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  p: 3,
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Receipt sx={{ fontSize: 80, mb: 2, opacity: 0.8 }} />
                  <Typography variant="h5" sx={{ opacity: 0.9 }}>
                    Beautiful Invoice Templates
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Features Section */}
      <Box id="features" sx={{ py: { xs: 6, md: 10 }, backgroundColor: '#f9fafb' }}>
        <Box sx={{ px: { xs: 2, md: 4 } }}>
          <Typography
            variant="h4"
            component="h2"
            sx={{
              fontWeight: 'bold',
              textAlign: 'center',
              mb: 2,
            }}
          >
            Powerful Features for Your Business
          </Typography>
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              color: '#6b7280',
              mb: 6,
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            Everything you need to manage invoices, quotations, and customer relationships
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 4 }}>
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card
                  key={index}
                  sx={{
                    height: '100%',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                      borderColor: '#667eea',
                    },
                  }}
                >
                  <CardContent>
                    <IconComponent
                      sx={{
                        fontSize: 48,
                        color: '#667eea',
                        mb: 2,
                      }}
                    />
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                      {feature.title}
                    </Typography>
                    <Typography color="text.secondary">{feature.description}</Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Pricing Section */}
      <Box id="pricing" sx={{ py: { xs: 6, md: 10 }, backgroundColor: 'white' }}>
        <Box sx={{ px: { xs: 2, md: 4 } }}>
          <Typography
            variant="h4"
            component="h2"
            sx={{
              fontWeight: 'bold',
              textAlign: 'center',
              mb: 2,
            }}
          >
            Simple, Transparent Pricing
          </Typography>
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              color: '#6b7280',
              mb: 6,
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            Choose the perfect plan for your business. Upgrade or downgrade anytime.
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 4 }}>
            {pricingPlans.map((plan, index) => (
              <PricingCard key={index} plan={plan} />
            ))}
          </Box>

          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Typography color="text.secondary">
              All plans include 14-day free trial. No credit card required.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* About Section */}
      <Box id="about" sx={{ py: { xs: 6, md: 10 }, backgroundColor: '#f9fafb' }}>
        <Box sx={{ px: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 6, alignItems: 'center' }}>
            <Box
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '20px',
                height: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <Typography variant="h4" fontWeight="bold" sx={{ textAlign: 'center', p: 3 }}>
                Trusted by Thousands of Businesses Worldwide
              </Typography>
            </Box>
            <Box>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                Why Choose InvoiceHub?
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <ZapIcon sx={{ color: '#667eea', flexShrink: 0 }} />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Lightning Fast
                    </Typography>
                    <Typography color="text.secondary">
                      Create professional invoices in seconds, not hours.
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Shield sx={{ color: '#667eea', flexShrink: 0 }} />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Secure & Reliable
                    </Typography>
                    <Typography color="text.secondary">
                      Bank-level security keeps your business data safe.
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <ClockIcon sx={{ color: '#667eea', flexShrink: 0 }} />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      24/7 Support
                    </Typography>
                    <Typography color="text.secondary">
                      Our support team is always here to help you succeed.
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: { xs: 6, md: 8 },
          textAlign: 'center',
          px: { xs: 2, md: 4 },
        }}
      >
        <Box sx={{ maxWidth: 'sm', mx: 'auto' }}>
          <Typography variant="h4" component="h2" fontWeight="bold" sx={{ mb: 2 }}>
            Ready to Transform Your Invoicing?
          </Typography>
          <Typography sx={{ mb: 4, opacity: 0.95 }}>
            Join thousands of businesses that have already streamlined their billing process.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              sx={{
                backgroundColor: 'white',
                color: '#667eea',
                fontWeight: 'bold',
                py: 1.5,
                px: 4,
                '&:hover': { backgroundColor: '#f3e8ff' },
              }}
              onClick={() => navigate('/register')}
            >
              Get Started Free
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                borderColor: 'white',
                color: 'white',
                fontWeight: 'bold',
                py: 1.5,
                px: 4,
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
              }}
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          backgroundColor: '#1f2937',
          color: '#9ca3af',
          py: 6,
          px: { xs: 2, md: 4 },
        }}
      >
        <Box sx={{ maxWidth: 'lg', mx: 'auto' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 4, mb: 4 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Receipt sx={{ fontSize: 28, color: '#667eea' }} />
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff' }}>
                  InvoiceHub
                </Typography>
              </Box>
              <Typography variant="body2">
                Professional invoice management for modern businesses.
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff', mb: 2 }}>
                Product
              </Typography>
              <Stack spacing={1}>
                <Typography component="a" href="#features" sx={{ textDecoration: 'none', color: 'inherit', '&:hover': { color: '#667eea' }, cursor: 'pointer' }}>
                  Features
                </Typography>
                <Typography component="a" href="#pricing" sx={{ textDecoration: 'none', color: 'inherit', '&:hover': { color: '#667eea' }, cursor: 'pointer' }}>
                  Pricing
                </Typography>
              </Stack>
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff', mb: 2 }}>
                Company
              </Typography>
              <Stack spacing={1}>
                <Typography component="a" href="#about" sx={{ textDecoration: 'none', color: 'inherit', '&:hover': { color: '#667eea' }, cursor: 'pointer' }}>
                  About Us
                </Typography>
                <Typography component="a" href="#" sx={{ textDecoration: 'none', color: 'inherit', '&:hover': { color: '#667eea' }, cursor: 'pointer' }}>
                  Blog
                </Typography>
              </Stack>
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff', mb: 2 }}>
                Legal
              </Typography>
              <Stack spacing={1}>
                <Typography component="a" href="#" sx={{ textDecoration: 'none', color: 'inherit', '&:hover': { color: '#667eea' }, cursor: 'pointer' }}>
                  Privacy Policy
                </Typography>
                <Typography component="a" href="#" sx={{ textDecoration: 'none', color: 'inherit', '&:hover': { color: '#667eea' }, cursor: 'pointer' }}>
                  Terms of Service
                </Typography>
              </Stack>
            </Box>
          </Box>
          <Box sx={{ borderTop: '1px solid #374151', pt: 4, textAlign: 'center' }}>
            <Typography variant="body2">
              © 2024 InvoiceHub. All rights reserved.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LandingPage;
