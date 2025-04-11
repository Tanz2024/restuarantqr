import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Typography, Box, Button, Stack } from '@mui/material';

const RestaurantMenuPage = () => {
  const router = useRouter();
  const { restaurantId } = router.query;  // Get restaurantId from the URL dynamically

  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch menu items for the restaurant
  useEffect(() => {
    if (!restaurantId) return;  // Wait until the restaurantId is available

    const fetchMenus = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/menus/${restaurantId}`);
        setMenus(response.data.menus);  // Set the fetched menus in state
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch menu items');
        setLoading(false);
      }
    };

    fetchMenus();
  }, [restaurantId]);

  if (loading) {
    return <Typography variant="h6">Loading...</Typography>;
  }

  if (error) {
    return <Typography variant="h6" color="error">{error}</Typography>;
  }

  return (
    <div>
      <Typography variant="h4" align="center" gutterBottom>
        Menu for Restaurant {restaurantId}
      </Typography>

      <Box sx={{ padding: 2 }}>
        <Stack spacing={2}>
          {menus.length > 0 ? (
            menus.map((menu: any) => (
              <Box key={menu.id} sx={{ border: '1px solid #ccc', padding: 2 }}>
                <Typography variant="h6">{menu.name}</Typography>
                <Typography variant="body1">{menu.description}</Typography>
                <Typography variant="body1">Price: ${menu.price}</Typography>
                <Button variant="contained" color="primary">
                  Add to Cart
                </Button>
              </Box>
            ))
          ) : (
            <Typography variant="body1">No menu items available.</Typography>
          )}
        </Stack>
      </Box>
    </div>
  );
};

export default RestaurantMenuPage;
