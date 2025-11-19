import React, { useState } from 'react';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import ServicesTab from './ServicesTab.tsx';
import CustomersTab from './CustomersTab.tsx';
import EmployeesTab from './EmployeesTab.tsx';
import BookingsTab from './BookingsTab.tsx';
import AssignmentTab from './AssignmentTab.tsx';
import BillingTab from './BillingTab.tsx';
import InvoicesTab from './InvoicesTab.tsx';
import CommissionTab from './CommissionTab.tsx';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`service-billing-tabpanel-${index}`}
      aria-labelledby={`service-billing-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ServiceBillingScreen: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ width: '100vw', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Container maxWidth="xl" sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <AppBar position="static" sx={{ backgroundColor: '#673ab7', mb: 3, borderRadius: 1 }}>
          <Toolbar>
            <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1 }}>
              💆 Service Billing Management
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Tabs */}
        <Paper sx={{ borderRadius: 2 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                fontWeight: 'bold',
                textTransform: 'none',
                fontSize: '1rem',
              },
            }}
          >
            <Tab label="📋 Bookings" />
            <Tab label="🔗 Assignments" />
            <Tab label="💵 Billing" />
            <Tab label="📄 Invoices" />
            <Tab label="💅 Services" />
            <Tab label="👥 Customers" />
            <Tab label="👤 Employees" />
            <Tab label="💰 Commission" />
          </Tabs>

          <TabPanel value={currentTab} index={0}>
            <BookingsTab />
          </TabPanel>
          <TabPanel value={currentTab} index={1}>
            <AssignmentTab />
          </TabPanel>
          <TabPanel value={currentTab} index={2}>
            <BillingTab />
          </TabPanel>
          <TabPanel value={currentTab} index={3}>
            <InvoicesTab />
          </TabPanel>
          <TabPanel value={currentTab} index={4}>
            <ServicesTab />
          </TabPanel>
          <TabPanel value={currentTab} index={5}>
            <CustomersTab />
          </TabPanel>
          <TabPanel value={currentTab} index={6}>
            <EmployeesTab />
          </TabPanel>
          <TabPanel value={currentTab} index={7}>
            <CommissionTab />
          </TabPanel>
        </Paper>
      </Container>
    </Box>
  );
};

export default ServiceBillingScreen;
