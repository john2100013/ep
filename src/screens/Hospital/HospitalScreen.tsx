import React from 'react';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import {
  LocalHospital as HospitalIcon,
  AssignmentInd as ReceptionistIcon,
  MedicalServices as DoctorIcon,
  Science as LabIcon,
  LocalPharmacy as PharmacyIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const HospitalScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

  const go = (path: string) => {
    navigate(path);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Hospital Module
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Use the buttons below to open different parts of the Hospital module.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant={currentPath === '/hospital/receptionist' || currentPath === '/hospital' ? 'contained' : 'outlined'}
            startIcon={<ReceptionistIcon />}
            onClick={() => go('/hospital/receptionist')}
          >
            Receptionist
          </Button>

          <Button
            variant={currentPath === '/hospital/doctor' ? 'contained' : 'outlined'}
            startIcon={<DoctorIcon />}
            onClick={() => go('/hospital/doctor')}
          >
            Doctor
          </Button>

          <Button
            variant={currentPath === '/hospital/lab' ? 'contained' : 'outlined'}
            startIcon={<LabIcon />}
            onClick={() => go('/hospital/lab')}
          >
            Lab
          </Button>

          <Button
            variant={currentPath === '/hospital/pharmacy' ? 'contained' : 'outlined'}
            startIcon={<PharmacyIcon />}
            onClick={() => go('/hospital/pharmacy')}
          >
            Pharmacy
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" color="text.secondary">
          Quick links
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
          <Button startIcon={<HospitalIcon />} onClick={() => go('/hospital')}>
            Hospital Home
          </Button>
          <Button onClick={() => go('/hospital/receptionist')}>Receptionist</Button>
          <Button onClick={() => go('/hospital/doctor')}>Doctor</Button>
          <Button onClick={() => go('/hospital/lab')}>Lab</Button>
          <Button onClick={() => go('/hospital/pharmacy')}>Pharmacy</Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default HospitalScreen;
