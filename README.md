# Stitch Coffee POS - Full Stack Application

## Project Overview

This is a complete Coffee Shop POS (Point of Sale) system with:
- **Frontend**: HTML/CSS/JS with Tailwind CSS (static files)
- **Backend**: Node.js/Express REST API
- **Database**: Supabase (PostgreSQL)

## Project Structure

```
stitch/
├── backend/                    # Node.js/Express backend
│   ├── package.json           # Dependencies
│   ├── server.js              # Main server file
│   └── .env.example           # Environment variables template
│
├── customer_menu/             # Menu screen (customer)
│   └── code.html
│
├── cart_checkout/            # Cart & checkout screen
│   └── code.html
│
├── kitchen_queue/            # Kitchen order queue
│   └── code.html
│
├── order_history/            # Order history
│   └── code.html
│
├── table_management_1/       # Table management (grid)
│   └── code.html
│
├── m_coffee_visual_table_layout/  # Visual table layout
│   └── code.html
│
├── hi_u_su_t_nh_n_vi_n_so_s_nh_thu_nh_p/  # Staff performance
│   └── code.html
│
└── supabase_schema.sql       # Database schema
```

## Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor and run the contents of `supabase_schema.sql`
3. Note your project URL and anon key from Settings > API

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:
```env
PORT=3000
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
```

Start the server:
```bash
npm start
```

The backend will run at http://localhost:3000

### 3. Frontend Setup

The frontend is static HTML files. You can:
- Open directly in browser (for development)
- Or serve with any static server

For development, you can use VS Code Live Server or:
```bash
npx serve .
```

## API Endpoints

### Menu
- `GET /api/menu/categories` - Get all categories
- `GET /api/menu/items` - Get all menu items
- `GET /api/menu/full` - Get full menu with categories

### Orders
- `GET /api/orders/active` - Get active orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id/status` - Update order status
- `GET /api/orders/history` - Get order history

### Tables
- `GET /api/tables` - Get all tables
- `GET /api/tables/:id` - Get table details
- `PATCH /api/tables/:id` - Update table

### Staff
- `GET /api/staff` - Get all staff
- `GET /api/staff/earnings/summary` - Get staff earnings

### Payments
- `POST /api/payments` - Process payment

## Screen Flow

1. **Customer Menu** (`customer_menu/code.html`)
   - Browse menu by category
   - Add items to cart
   - Navigate to cart

2. **Cart & Checkout** (`cart_checkout/code.html`)
   - Review cart items
   - Select order type (dine-in/takeaway)
   - Select table (for dine-in)
   - Add special instructions
   - Confirm order → creates order in database

3. **Kitchen Queue** (`kitchen_queue/code.html`)
   - View active orders
   - Start preparing orders
   - Mark as ready
   - Complete orders

4. **Order History** (`order_history/code.html`)
   - View completed orders
   - Filter by status
   - See revenue statistics

5. **Table Management** (`table_management_1/code.html`)
   - View all tables
   - Filter by status (available/occupied)

6. **Staff Performance** (`hi_u_su_t_nh_n_vi_n_so_s_nh_thu_nh_p/code.html`)
   - View staff list
   - See earnings

## Data Flow

1. **Menu Display**: Frontend calls API → API fetches from Supabase → Returns JSON → Rendered in HTML

2. **Order Creation**: 
   - Cart stored in localStorage
   - On checkout: POST to `/api/orders`
   - API creates order + order_items in Supabase
   - Table status updated to "occupied"

3. **Kitchen Updates**:
   - PATCH to `/api/orders/:id/status`
   - Status changes: pending → preparing → ready → completed
   - Table auto-updates to "available" when order completes

## Notes

- All screen navigation uses relative paths
- Cart is stored in localStorage for persistence
- The API assumes Supabase is already populated with sample data
- For production, add proper authentication and error handling