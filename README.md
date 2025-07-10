# BiRewards

## Environment Variable Setup for API URLs

This project uses environment variables to set the backend API URL, ensuring seamless switching between local development and production without code changes.

### Local Development
Create a `.env` file in the project root with:
```
VITE_API_URL=http://localhost:3000/api
```

### Production Deployment
Create a `.env.production` file in the project root with:
```
VITE_API_URL=https://api.birewards.id/api
```

- **Never hardcode API URLs in your code.** Always use the `API_URL` variable from `src/utils/api.ts` for all API calls.
- The build process will automatically use the correct environment file based on the environment (development or production).
- You do not need to change any URLs when switching environments—just build and deploy.

---
 - Loyalty Rewards System

A modern loyalty rewards system built with React, TypeScript, and Express.js.

## Features

- 🎯 Role-based access control (Owner, Manager, Cashier, Waiter, Admin, User)
- 💎 Tiered loyalty system (Bronze, Silver, Gold)
- 💰 Points accumulation and redemption
- 🎁 Voucher management
- 📊 Transaction history
- 📱 Responsive design
- 🔒 Secure authentication

## Tech Stack

- **Frontend:**
  - React 18
  - TypeScript
  - Tailwind CSS
  - Vite
  - React Context for state management

- **Backend:**
  - Node.js
  - Express.js
  - PostgreSQL
  - JWT Authentication

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/KPPOKE/BiRewards.git
   cd bireward-utama
   ```

2. Install dependencies:
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd backend
   npm install
   ```

3. Set up environment variables:
   - Create `.env` file in the backend directory
   - Add the following variables:
     ```
     PORT=5000
     db_user=your_db_user
     db_password=your_db_password
     db_port=5432
     db_name=birewards
     db_host=localhost
     ```

4. Start the development servers:
   ```bash
   # Start frontend (from root directory)
   npm run dev

   # Start backend (from backend directory)
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Project Structure

```
bireward-utama/
├── src/                    # Frontend source code
│   ├── components/        # React components
│   ├── context/          # React context providers
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── backend/              # Backend source code
│   ├── Controllers/      # Route controllers
│   ├── routes/          # API routes
│   └── db.js            # Database configuration
└── public/              # Static assets
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.
