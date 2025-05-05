# Fintks Appointments

A modern appointment management system built with React and Node.js.

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- SQLite3

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment file and configure your variables:
   ```bash
   cp .env.example .env
   ```

## Development

1. Start the development server:
   ```bash
   npm run dev
   ```
2. The application will be available at `http://localhost:5173`
3. The API server will run on `http://localhost:3000`

## Environment Variables

Configure the following variables in your `.env` file:

```env
VITE_PORT=5173
VITE_API_URL=http://localhost:3000
# Add other required environment variables
```

## Building for Production

1. Build the application:
   ```bash
   npm run build
   ```
2. The built files will be in the `dist` directory

## Deployment

1. Set up your production environment variables
2. Build the application as described above
3. Serve the built files using a static file server
4. Configure your API server for production

### Deployment Platforms

You can deploy this application on:
- Vercel
- Netlify
- Heroku
- Any node.js hosting service

## Features

- User authentication
- Appointment scheduling
- Employee management
- Service management
- Email notifications
- Admin dashboard

## Project Structure

```
/
├── src/                # Frontend source files
│   ├── components/     # React components
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom hooks
│   └── theme/          # Theme configuration
├── routes/             # API routes
├── utils/              # Utility functions
└── public/             # Static assets
```

## Additional Documentation

- Check `EMAIL_SETUP_GUIDE.md` for email configuration
- See `vite.config.js` for build configuration
- Review `.env.example` for required environment variables
- To make a user admin you need access to database and change the user role to `admin`

## License

MIT
