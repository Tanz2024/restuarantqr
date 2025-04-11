import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import pg from 'pg';
import QRCode from 'qrcode';
import bcrypt from 'bcrypt';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

// Load environment variables
dotenv.config();
const PORT = process.env.PORT || 5000;
const DOMAIN = process.env.DOMAIN || 'http://localhost:3000';
const SESSION_SECRET = process.env.SESSION_SECRET || 'your_session_secret_here';

// Set up PostgreSQL connection pool
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize Express app
const app = express();

// ---------------------
// Security & Logging Middlewares
// ---------------------
app.use(helmet());
app.use(
  cors({
    credentials: true,
    origin: DOMAIN, // Must match your frontend exactly
  })
);
app.use(express.json());
app.use(morgan('combined'));

// ---------------------
// Ensure "uploads" folder exists
// ---------------------
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// ✅ FIX: Inject CORS headers manually before serving static files
// Add this BEFORE express.static
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', DOMAIN); // e.g., http://localhost:3000
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(
  '/uploads',
  cors({
    origin: DOMAIN,
    credentials: true,
  }),
  express.static(uploadDir)
);


// ---------------------
// Session Middleware Setup using connect-pg-simple
// ---------------------
const PgSessionStore = pgSession(session);
app.use(
  session({
    store: new PgSessionStore({
      pool: pool,
      tableName: 'session',
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Set to false in development
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// ---------------------
// Multer Configuration for File Uploads
// ---------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({ storage, fileFilter });

// Utility function to resize images
const resizeImage = async (filePath, targetFilePath, format = 'jpeg') => {
  let imageProcessor = sharp(filePath).resize(500, 500); // Resize image to 500x500px

  // Resize based on the desired format
  if (format === 'jpeg') {
    imageProcessor = imageProcessor.jpeg({ quality: 90 }); // Adjust quality for JPEG
  } else if (format === 'png') {
    imageProcessor = imageProcessor.png({ quality: 90 }); // PNG compression (lossless)
  } else if (format === 'webp') {
    imageProcessor = imageProcessor.webp({ quality: 90 }); // WebP format with good quality
  }

  await imageProcessor.toFile(targetFilePath);
};

// ---------------------
// Global Error Handler
// ---------------------
const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};

// ---------------------
// Authentication Middleware (Session Based)
// ---------------------
const ensureAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
};

// ---------------------
// ROUTES
// ---------------------

// Health Check
app.get('/', (req, res) => {
  res.send('Production-grade Restaurant Management API is running.');
});

// Google reCAPTCHA Verification Endpoint
app.post('/verify-captcha', async (req, res) => {
  const { token } = req.body;
  const secret = process.env.RECAPTCHA_SECRET;
  try {
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`,
      { method: 'POST' }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    res.status(500).json({ error: 'Failed to verify reCAPTCHA' });
  }
});

// Fetch restaurant details by ID
app.get('/api/restaurants/:id', async (req, res) => {
  const { id } = req.params;  // Get restaurant ID from the URL
  try {
    // Query the database to get restaurant details by ID
    const result = await pool.query('SELECT * FROM restaurants WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.json({ restaurant: result.rows[0] });  // Return the restaurant details
  } catch (err) {
    console.error('Error fetching restaurant details:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
//Profile//
// GET /api/profile - Fetch user profile along with restaurant details if available
app.get('/api/profile', ensureAuthenticated, async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.id) {
      console.warn('Session user is missing');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.session.user.id;
    console.log('Fetching profile for user ID:', userId);

    const result = await pool.query(
      `SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          r.id AS restaurant_id,
          r.name AS restaurant_name,
          r.logo_url,
          r.phone,
          r.address AS restaurant_address,
          r.opening_hours,
          r.closing_hours,
          r.description,
          r.region
       FROM users u
       LEFT JOIN restaurants r ON r.owner_id = u.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const row = result.rows[0];
    const user = {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      // If a restaurant record exists, attach its details
      restaurant: row.restaurant_id ? {
        id: row.restaurant_id,
        restaurant_name: row.restaurant_name,
        logo_url: row.logo_url,
        phone: row.phone,
        address: row.restaurant_address,
        opening_hours: row.opening_hours,
        closing_hours: row.closing_hours,
        description: row.description,
        region: row.region
      } : null
    };

    res.json({ user });
  } catch (err) {
    console.error('Profile fetch error:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});
app.put('/api/profile/update', ensureAuthenticated, async (req, res) => {
  // Extract user and restaurant fields from the request body.
  const {
    name,          // user's name
    email,         // user's email
    phone,         // restaurant phone
    restaurantName, // new restaurant name (as entered by the owner)
    logoUrl,       // URL/path for restaurant logo
    address,       // restaurant address
    openingHours,  // restaurant opening hours
    closingHours,  // restaurant closing hours
    description    // restaurant description/motto
  } = req.body;
  
  try {
    const userId = req.session.user.id;
    
    // Update basic user details (name and email)
    const userResult = await pool.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, role',
      [name, email, userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    let updatedUser = userResult.rows[0];
    
    // If the user is an owner and a restaurant ID exists in session, update restaurant details.
    if (updatedUser.role === 'owner' && req.session.user.restaurant_id) {
      const restaurantResult = await pool.query(
        `UPDATE restaurants 
         SET 
           phone = $1, 
           name = $2, 
           logo_url = $3, 
           address = $4, 
           opening_hours = $5, 
           closing_hours = $6, 
           description = $7 
         WHERE id = $8 
         RETURNING 
           id,
           phone,
           logo_url,
           address,
           opening_hours,
           closing_hours,
           description,
           name AS restaurant_name,
           region`,
        [phone, restaurantName, logoUrl, address, openingHours, closingHours, description, req.session.user.restaurant_id]
      );
      
      // Merge restaurant details into the updated user object.
      updatedUser = { 
        ...updatedUser, 
        restaurant: restaurantResult.rows[0]
      };
    }
    
    // Optionally update session data with the new user name.
    req.session.user.name = updatedUser.name;
    
    res.json({ user: updatedUser });
  } catch (err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});


// PUT /api/auth/change-password - Change user password
app.put('/api/auth/change-password', ensureAuthenticated, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const userId = req.session.user.id;
    const result = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Old password is incorrect' });
    }
    
    const hashedNew = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedNew, userId]
    );
    
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// PUT /api/restaurants/:id/settings - Update restaurant settings (separate endpoint)
app.put('/api/restaurants/:id/settings', ensureAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { name, phone, opening_hours, closing_hours, address, description, region } = req.body;
  try {
    // Only allow restaurant owners to update settings for their own restaurant.
    if (req.session.user.role !== 'owner' || req.session.user.restaurant_id !== id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const result = await pool.query(
      `UPDATE restaurants
       SET name = $1, phone = $2, opening_hours = $3, closing_hours = $4, address = $5, description = $6, region = $7
       WHERE id = $8 RETURNING *`,
      [name, phone, opening_hours, closing_hours, address, description, region, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    res.json({ restaurant: result.rows[0] });
  } catch (err) {
    console.error('Restaurant settings update error:', err.message);
    res.status(500).json({ error: 'Failed to update restaurant settings' });
  }
});



/* ====================================================================
   USERS TABLE
   - Registration & Login Endpoints (Session-based)
==================================================================== */
app.post('/api/auth/register', async (req, res) => {
  const {
    name,         // used as the user's name and restaurant name
    email,
    password,
    plan,
    address,
    phone,
    openingHours,
    closingHours,
    description,
    region,
    logoUrl       // Optional logo URL for the restaurant
  } = req.body;

  try {
    // Check if user already exists (email must be unique)
    const exists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user with role 'owner'
    const userResult = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, 'owner']
    );
    const user = userResult.rows[0];

    // Insert restaurant details into the "restaurants" table.
    // Note: we alias the restaurant name as restaurant_name.
    const restaurantResult = await pool.query(
      `INSERT INTO restaurants 
         (name, owner_id, plan, address, phone, opening_hours, closing_hours, description, region, logo_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING 
         id, 
         name AS restaurant_name, 
         plan, 
         address, 
         phone, 
         opening_hours, 
         closing_hours, 
         description, 
         region, 
         logo_url`,
      [
        name,
        user.id,
        plan || 'Basic',
        address || null,
        phone || null,
        openingHours || null,
        closingHours || null,
        description || null,
        region || null,
        logoUrl || null
      ]
    );
    const restaurant = restaurantResult.rows[0];

    // Save session with both user and restaurant details.
    req.session.user = {
      id: user.id,
      role: user.role,
      name: user.name,
      restaurant_id: restaurant.id,
      restaurant_name: restaurant.restaurant_name // added for dashboard display
    };

    // Return the user and restaurant data.
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.restaurant_name
      },
      restaurant
    });
  } catch (err) {
    console.error('Registration error:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});




app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];

    if (user.role === 'admin') {
      if (password !== 'admin123') {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      req.session.user = { id: user.id, role: user.role, name: user.name };
      return res.json({ user });
    } else {
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      let restaurant_id = null;
      if (user.role === 'owner') {
        const restaurantResult = await pool.query(
          'SELECT id FROM restaurants WHERE owner_id = $1 LIMIT 1',
          [user.id]
        );
        if (restaurantResult.rows.length > 0) {
          restaurant_id = restaurantResult.rows[0].id;
        }
      }

      req.session.user = { id: user.id, role: user.role, name: user.name, restaurant_id };
      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          restaurant_id,
        },
        token: 'optional-if-using-jwt',
      });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

// --------------------------------------------------------------------
// Restaurants: QR Code generation for public menu
app.get('/api/restaurants/:id/qrcode', async (req, res) => {
  const restaurantId = req.params.id;
  const url = `${DOMAIN}/customer/${restaurantId}`;
  try {
    const qrImage = await QRCode.toDataURL(url);
    res.json({ qrImage });
  } catch (err) {
    console.error('QR Code generation error:', err);
    res.status(500).json({ error: 'QR Code generation failed' });
  }
});

// --------------------------------------------------------------------
// Subscriptions & Plan Features
app.get('/api/subscriptions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subscriptions WHERE is_active = true');
    res.json({ subscriptions: result.rows });
  } catch (err) {
    console.error('Fetching subscriptions error:', err);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

app.get('/api/plan_features/:plan', async (req, res) => {
  const { plan } = req.params;
  try {
    const result = await pool.query('SELECT * FROM plan_features WHERE plan_name = $1', [plan]);
    res.json({ features: result.rows });
  } catch (err) {
    console.error('Fetching plan features error:', err);
    res.status(500).json({ error: 'Failed to fetch plan features' });
  }
});

// --------------------------------------------------------------------
// MENUS: Create and Fetch (with multer for image/video uploads)
// Create a new menu item
app.post(
  '/api/menus',
  ensureAuthenticated,
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]),
  async (req, res) => {
    try {
      const { name, description, category, price } = req.body;
      const restaurant_id = req.session.user?.restaurant_id;

      // Debug logs
      console.log('Create menu payload:', req.body);
      console.log('Session user:', req.session.user);
      console.log('Uploaded files:', req.files);

      if (req.session.user.role !== 'owner') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (!name || !description || !category || !price || !restaurant_id) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice)) {
        return res.status(400).json({ error: 'Invalid price' });
      }

      const imageUrl = req.files?.image ? `/uploads/${req.files.image[0].filename}` : null;


      const videoUrl = req.files?.video ? req.files.video[0].path : null;

      const result = await pool.query(
        `INSERT INTO menus 
         (restaurant_id, name, description, category, price, image_url, video_url, is_available) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING *`,
        [restaurant_id, name, description, category, parsedPrice, imageUrl, videoUrl]
      );

      res.json({ menu: result.rows[0] });
    } catch (err) {
      console.error('Create menu error:', err.stack || err);
      res.status(500).json({ error: 'Failed to create menu item' });
    }
  }
);
// Fetch menu items for a given restaurant
app.get('/api/menus/:restaurant_id', async (req, res) => {
  const { restaurant_id } = req.params;

  try {
    // Return all menu items, not just those marked as available
    const result = await pool.query(
      'SELECT * FROM menus WHERE restaurant_id = $1',
      [restaurant_id]
    );

    // Parse availability_schedule into object format for frontend
    const menus = result.rows.map((menu) => {
      if (menu.availability_schedule) {
        const parts = menu.availability_schedule.split(',').map((s) => s.trim());
        menu.availability_schedule = {
          days: parts[0] || '',
          timeRange: parts[1] || '',
        };
      }
      return menu;
    });

    res.json({ menus });
  } catch (err) {
    console.error('Fetch menus error:', err.stack || err);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// Edit (update) a menu item
app.put(
  '/api/menus/:menu_id',
  ensureAuthenticated,
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]),
  async (req, res) => {
    try {
      const { menu_id } = req.params;
      let {
        name,
        description,
        category,
        price,
        is_available,
        dishTags,
        popularity,
        rating,
        availabilitySchedule
      } = req.body;
      
      // Parse values
      price = parseFloat(price);
      is_available = is_available === 'true';
      // Use parseFloat for rating if you expect decimal values; if only whole stars, parseInt works too.
      rating = rating ? parseFloat(rating) : null;
      dishTags = dishTags ? dishTags.split(',').map(tag => tag.trim()) : [];
      // Since availabilitySchedule comes in as a string (e.g., "Mon-Fri, 11:00-14:00"), use it as-is.
      availabilitySchedule = availabilitySchedule ? availabilitySchedule : null;
      
      const restaurant_id = req.session.user?.restaurant_id;

      // Debug logs
      console.log('Edit menu payload:', req.body);
      console.log('Session user:', req.session.user);
      console.log('Uploaded files:', req.files);

      // Check authorization
      if (req.session.user.role !== 'owner') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (!menu_id || !restaurant_id) {
        return res.status(400).json({ error: 'Missing menu ID or restaurant ID' });
      }
      // Ensure at least one editable field is provided
      if (
        !name && !description && !category &&
        price === undefined && is_available === undefined &&
        !dishTags && !popularity && rating === undefined &&
        !availabilitySchedule && !req.files
      ) {
        return res.status(400).json({ error: 'No fields to update' });
      }
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice)) {
        return res.status(400).json({ error: 'Invalid price' });
      }

      // New files if uploaded; otherwise, keep current values
    const imageUrl = req.files?.image ? `/uploads/${req.files.image[0].filename}` : null;


      const videoUrl = req.files?.video ? req.files.video[0].path : null;

      // Build update query dynamically
      let query = `UPDATE menus SET 
        name = $1, 
        description = $2, 
        category = $3, 
        price = $4, 
        is_available = $5,
        dish_tags = $6,
        popularity = $7,
        rating = $8,
        availability_schedule = $9`;
      const params = [
        name,
        description,
        category,
        parsedPrice,
        is_available,
        dishTags,
        popularity,
        rating,
        availabilitySchedule
      ];

      if (imageUrl) {
        params.push(imageUrl);
        query += `, image_url = $${params.length}`;
      }
      if (videoUrl) {
        params.push(videoUrl);
        query += `, video_url = $${params.length}`;
      }

      params.push(menu_id, restaurant_id);
      query += ` WHERE id = $${params.length - 1} AND restaurant_id = $${params.length} RETURNING *`;

      const result = await pool.query(query, params);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Menu item not found or not authorized' });
      }
      res.json({ menu: result.rows[0] });
    } catch (err) {
      console.error('Edit menu error:', err.stack || err);
      res.status(500).json({ error: 'Failed to update menu item' });
    }
  }
);

// Delete a menu item
app.delete('/api/menus/:menu_id', ensureAuthenticated, async (req, res) => {
  try {
    const { menu_id } = req.params;
    const restaurant_id = req.session.user?.restaurant_id;

    if (req.session.user.role !== 'owner') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (!menu_id || !restaurant_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      'DELETE FROM menus WHERE id = $1 AND restaurant_id = $2 RETURNING *',
      [menu_id, restaurant_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found or not authorized' });
    }
    res.json({ message: 'Menu item deleted successfully', menu: result.rows[0] });
  } catch (err) {
    console.error('Delete menu error:', err.stack || err);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

app.put('/api/menus/:menu_id/availability', ensureAuthenticated, async (req, res) => {
  try {
    const { menu_id } = req.params;
    const { is_available } = req.body;
    const restaurant_id = req.session.user?.restaurant_id;

    if (req.session.user.role !== 'owner') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await pool.query(
      'UPDATE menus SET is_available = $1 WHERE id = $2 AND restaurant_id = $3 RETURNING *',
      [is_available, menu_id, restaurant_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu not found or not authorized' });
    }

    res.json({ menu: result.rows[0] });
  } catch (err) {
    console.error('Update availability error:', err.stack || err);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});


// --------------------------------------------------------------------
// ORDERS & ORDER_ITEMS
app.post('/api/orders', async (req, res) => {
  const { restaurant_id, table_number, items, customer_details, special_requests } = req.body;

  try {
    // Insert the order details into the 'orders' table
    const orderResult = await pool.query(
      'INSERT INTO orders (restaurant_id, table_number, customer_name, customer_contact, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [restaurant_id, table_number, customer_details.name, customer_details.contact]
    );
    const order = orderResult.rows[0];

    // Insert each order item into the 'order_items' table
    for (const item of items) {
      const { menu_id, name, quantity, price } = item;
      await pool.query(
        'INSERT INTO order_items (order_id, menu_id, name, quantity, price, special_requests) VALUES ($1, $2, $3, $4, $5, $6)',
        [order.id, menu_id, name, quantity, price, special_requests]
      );
    }

    // Create a new entry for order status
    await pool.query(
      'INSERT INTO order_status (order_id, status, priority, time_elapsed) VALUES ($1, $2, $3, $4)',
      [order.id, 'Pending', 'Normal', 0]
    );

    res.json({ message: 'Order placed successfully', order });
  } catch (err) {
    console.error('Order placement error:', err);
    res.status(500).json({ error: 'Order placement failed' });
  }
});


// --------------------------------------------------------------------
// PAYMENTS
app.post('/api/payments', ensureAuthenticated, async (req, res) => {
  const { restaurant_id, amount, provider, transaction_id } = req.body;
  try {
    const paymentResult = await pool.query(
      'INSERT INTO payments (user_id, restaurant_id, amount, status, provider, transaction_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.session.user.id, restaurant_id, amount, 'Success', provider, transaction_id]
    );
    res.json({ payment: paymentResult.rows[0] });
  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});
app.patch('/api/orders/:order_id/status', async (req, res) => {
  const { order_id } = req.params;
  const { status, priority } = req.body;

  try {
    const result = await pool.query(
      'UPDATE order_status SET status = $1, priority = $2 WHERE order_id = $3 RETURNING *',
      [status, priority, order_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order status updated', status: result.rows[0] });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});
app.patch('/api/orders/:order_id/assign', async (req, res) => {
  const { order_id } = req.params;
  const { kitchen_section, staff_member } = req.body;

  try {
    const result = await pool.query(
      'UPDATE orders SET kitchen_section = $1, staff_member = $2 WHERE id = $3 RETURNING *',
      [kitchen_section, staff_member, order_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order assigned', order: result.rows[0] });
  } catch (err) {
    console.error('Error assigning order:', err);
    res.status(500).json({ error: 'Failed to assign order' });
  }
});
app.patch('/api/orders/:order_id', async (req, res) => {
  const { order_id } = req.params;
  const { items, special_requests, table_number } = req.body;

  try {
    // Update the order's table number and special requests
    const orderUpdate = await pool.query(
      'UPDATE orders SET table_number = $1 WHERE id = $2 RETURNING *',
      [table_number, order_id]
    );

    // Update the order items
    for (const item of items) {
      const { menu_id, name, quantity, price } = item;
      await pool.query(
        'UPDATE order_items SET name = $1, quantity = $2, price = $3, special_requests = $4 WHERE order_id = $5 AND menu_id = $6',
        [name, quantity, price, special_requests, order_id, menu_id]
      );
    }

    res.json({ message: 'Order updated successfully' });
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});
app.get('/api/orders/:order_id', async (req, res) => {
  const { order_id } = req.params;

  try {
    const result = await pool.query(
      'SELECT o.id, o.table_number, o.customer_name, o.customer_contact, o.created_at, os.status, os.priority, oi.name AS item_name, oi.quantity, oi.price, oi.special_requests ' +
      'FROM orders o ' +
      'JOIN order_status os ON o.id = os.order_id ' +
      'JOIN order_items oi ON o.id = oi.order_id ' +
      'WHERE o.id = $1',
      [order_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order: result.rows });
  } catch (err) {
    console.error('Error retrieving order:', err);
    res.status(500).json({ error: 'Failed to retrieve order' });
  }
});

app.get('/api/orders/history', async (req, res) => {
  const { status, start_date, end_date, customer_name } = req.query;
  let query = 'SELECT * FROM orders WHERE 1=1';

  const params = [];
  if (status) {
    query += ' AND status = $' + (params.length + 1);
    params.push(status);
  }
  if (start_date) {
    query += ' AND created_at >= $' + (params.length + 1);
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND created_at <= $' + (params.length + 1);
    params.push(end_date);
  }
  if (customer_name) {
    query += ' AND customer_name ILIKE $' + (params.length + 1);
    params.push('%' + customer_name + '%');
  }

  try {
    const result = await pool.query(query, params);
    res.json({ orders: result.rows });
  } catch (err) {
    console.error('Error fetching order history:', err);
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});

// --------------------------------------------------------------------
// SUPPORT TICKETS
app.post('/api/support', ensureAuthenticated, async (req, res) => {
  const { restaurant_id, subject, message } = req.body;
  try {
    const ticketResult = await pool.query(
      'INSERT INTO support_tickets (user_id, restaurant_id, subject, message, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.session.user.id, restaurant_id, subject, message, 'Open']
    );
    res.json({ ticket: ticketResult.rows[0] });
  } catch (err) {
    console.error('Support ticket error:', err);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

// --------------------------------------------------------------------
// LOGS
app.post('/api/logs', ensureAuthenticated, async (req, res) => {
  const { level, action, details } = req.body;
  try {
    const logResult = await pool.query(
      'INSERT INTO logs (user_id, level, action, details) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.session.user.id, level, action, details]
    );
    res.json({ log: logResult.rows[0] });
  } catch (err) {
    console.error('Log error:', err);
    res.status(500).json({ error: 'Failed to record log' });
  }
});

// --------------------------------------------------------------------
// FEEDBACK
app.post('/api/feedback', async (req, res) => {
  const { order_id, restaurant_id, rating, comment } = req.body;
  try {
    const feedbackResult = await pool.query(
      'INSERT INTO feedback (order_id, restaurant_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
      [order_id, restaurant_id, rating, comment]
    );
    res.json({ feedback: feedbackResult.rows[0] });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// --------------------------------------------------------------------
// WEBHOOKS
app.post('/api/webhooks', async (req, res) => {
  const { provider, event_type, payload } = req.body;
  try {
    await pool.query(
      'INSERT INTO webhooks (provider, event_type, payload) VALUES ($1, $2, $3)',
      [provider, event_type, payload]
    );
    res.json({ message: 'Webhook event recorded' });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Failed to record webhook event' });
  }
});

// --------------------------------------------------------------------
// Forgot Password for Restaurant Owners
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    const user = result.rows[0];
    
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Unauthorized request for this email.' });
    }
    
    const resetToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    
    console.log(`Password reset token for restaurant owner (${email}): ${resetToken}`);
    
    res.json({ message: 'Password reset link has been sent to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Error processing forgot password request.' });
  }
});

// --------------------------------------------------------------------
// Fetch analytics data
app.get('/api/analytics', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM restaurant_analytics');
    res.json({ analytics: result.rows });
  } catch (err) {
    console.error('Fetch analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Fallback Route (404)
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use(errorHandler);

// Start the Server
app.listen(PORT, () => {
  console.log(`Production-grade server running on port ${PORT}`);
});
