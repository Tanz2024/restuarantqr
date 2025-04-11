import { useState, useEffect } from 'react';
import { Typography, Box, Stack, Button } from '@mui/material';
import { useRouter } from 'next/router';
import axios from 'axios';
import Image from 'next/image';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const RestaurantDetailsPage = () => {
  const router = useRouter();
  const { restaurantId } = router.query; // Dynamic restaurantId from the URL

  // States for restaurant details, loading and error
  const [restaurantDetails, setRestaurantDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Log the restaurantId for debugging
  useEffect(() => {
    console.log('Restaurant ID:', restaurantId);  // Log restaurantId to check its value

    if (!restaurantId) return; // Exit if restaurantId is not yet available

    const fetchRestaurantDetails = async () => {
      try {
        // Fetch the restaurant details from your API
        const response = await axios.get(`http://localhost:5000/api/restaurants/${restaurantId}`);
        setRestaurantDetails(response.data.restaurant);  // Set the restaurant details
        setLoading(false);  // Set loading to false once data is fetched
      } catch (err) {
        setError('Failed to fetch restaurant details');
        setLoading(false);
      }
    };

    fetchRestaurantDetails(); // Call the function to fetch data
  }, [restaurantId]); // Re-fetch when restaurantId changes

  // Show loading message or error if the data is still loading or there's an error
  if (loading) {
    return <Typography variant="h6" align="center">Loading...</Typography>;
  }

  if (error) {
    return <Typography variant="h6" color="error" align="center">{error}</Typography>;
  }

  // Function to handle menu navigation
// In RestaurantDetailsPage component

const handleBrowseMenu = () => {
    if (!restaurantId) {  // Ensure you have a valid restaurantId
      console.error('No restaurantId available to navigate.');
      return;
    }
  
    const targetUrl = `/customers/menus/${restaurantId}`; // Navigate to the restaurant menus page
    console.log('Navigating to:', targetUrl);
    
    router.push(targetUrl); // Navigate to the menus for the current restaurant
  };
  

  return (
    <Box sx={{ padding: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#f4f4f9' }}>
      {/* Display restaurant name dynamically */}
      <Typography variant="h3" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 2 }}>
        {restaurantDetails?.name}
      </Typography>

      {/* Restaurant Details */}
      <Box sx={{ width: '100%', textAlign: 'center', mb: 3 }}>
        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
          <LocationOnIcon sx={{ mr: 1 }} />{restaurantDetails?.address}
        </Typography>
        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
          <PhoneIcon sx={{ mr: 1 }} />{restaurantDetails?.phone}
        </Typography>
        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
          <AccessTimeIcon sx={{ mr: 1 }} />{restaurantDetails?.opening_hours} - {restaurantDetails?.closing_hours}
        </Typography>
      </Box>

      {/* Browse Menu Button */}
      <Button 
        variant="contained" 
        sx={{ mb: 3 }} 
        onClick={handleBrowseMenu}  // Navigate to the menus page
      >
        Browse Menu
      </Button>

      {/* Footer with logo and text */}
      <Box sx={{
        position: 'fixed', bottom: 0, left: 0, right: 0, textAlign: 'center',
        padding: '16px', backgroundColor: '#ffffff', boxShadow: '0px -1px 5px rgba(0,0,0,0.1)'
      }}>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
          <Box
            sx={{
              width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Image src="/images/logo.png" alt="QUICKFIT Logo" width={60} height={60} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Powered by QUICKFIT
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
};

export default RestaurantDetailsPage;
