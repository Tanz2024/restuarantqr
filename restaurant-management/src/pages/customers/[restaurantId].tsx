// pages/customers/[restaurantId].tsx
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import QRCode from '@/components/QRCode'; // Assuming you have a QRCode component
import { Typography, Box, Button, Stack } from '@mui/material';
import html2canvas from 'html2canvas'; // Import html2canvas for capturing images
import { jsPDF } from 'jspdf'; // Import jsPDF for PDF generation
import styles from './[restaurantId].module.css'; // Styles for the page

const QRCodePage = () => {
  const router = useRouter();
  const { restaurantId } = router.query; // Get restaurantId from the URL dynamically

  const qrCodeRef = useRef<HTMLElement | null>(null); // Reference to the QR code element

  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state

  // Fetch restaurant details for the QR code page
  useEffect(() => {
    if (!restaurantId) return; // Wait until the restaurantId is available

    const fetchRestaurantDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/restaurants/${restaurantId}`);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch restaurant details');
        setLoading(false);
      }
    };

    fetchRestaurantDetails();
  }, [restaurantId]);

  if (loading) {
    return <Typography variant="h6">Loading...</Typography>;
  }

  if (error) {
    return <Typography variant="h6" color="error">{error}</Typography>;
  }

  // Handle QR code download as image
  const handleDownloadQRCodeImage = () => {
    if (qrCodeRef.current) {
      html2canvas(qrCodeRef.current).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `${restaurantId}-qr-code.png`;
        link.click();
      });
    }
  };

  // Handle QR code download as PDF
  const handleDownloadQRCodePDF = () => {
    if (qrCodeRef.current) {
      html2canvas(qrCodeRef.current).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const doc = new jsPDF();
        doc.addImage(imgData, 'PNG', 10, 10, 180, 180);
        doc.save(`${restaurantId}-qr-code.pdf`);
      });
    }
  };

  // Navigate to restaurant details page
  const navigateToDetailsPage = () => {
    router.push(`/customers/details?restaurantId=${restaurantId}`);
  };

  return (
    <div className={styles.container}>
      <Typography variant="h4">Scan the QR Code below to browse the menu and place your order.</Typography>

      <Box className={styles.qrCodeSection} ref={qrCodeRef}>
        <QRCode restaurantId={restaurantId as string} /> {/* Pass dynamic restaurantId to QRCode */}
      </Box>

      <Box sx={{ mt: 3 }}>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={handleDownloadQRCodeImage} className={styles.downloadButton}>
            Download QR Code as Image
          </Button>
          <Button variant="contained" onClick={handleDownloadQRCodePDF} className={styles.downloadButton}>
            Download QR Code as PDF
          </Button>
        </Stack>
      </Box>

      {/* Conditionally render the View Details button based on the environment */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 3 }}>
          <Button variant="contained" onClick={navigateToDetailsPage} className={styles.detailsButton}>
            View Restaurant Details
          </Button>
        </Box>
      )}
    </div>
  );
};

export default QRCodePage;
