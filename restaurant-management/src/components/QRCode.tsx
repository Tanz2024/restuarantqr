// QRCode.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './QRCode.module.css';

interface QRCodeProps {
  restaurantId: string;
}

const QRCode: React.FC<QRCodeProps> = ({ restaurantId }) => {
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/restaurants/${restaurantId}/qrcode`);
        setQrCodeImage(response.data.qrImage);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching QR Code:', error);
        setLoading(false);
      }
    };

    if (restaurantId) {
      fetchQRCode();
    }
  }, [restaurantId]);

  if (loading) {
    return <div className={styles.loading}>Loading QR Code...</div>;
  }

  if (!qrCodeImage) {
    return <div className={styles.error}>Error: QR Code could not be generated.</div>;
  }

  return (
    <div className={styles.qrCodeContainer}>
      <h3>Scan the QR Code below to place your order:</h3>
      <img src={qrCodeImage} alt="QR Code" className={styles.qrImage} />
    </div>
  );
};

export default QRCode;
