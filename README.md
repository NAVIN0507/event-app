# EventHub - Event Management Application

A modern event management platform built with Next.js, NextAuth, and Drizzle ORM. Users can discover, register for, and organize events with ease.

## Features

### For Attendees
- Browse and search events
- Register for free and paid events
- View event details and organizer information
- Personal dashboard with registered events
- Event check-in tracking

### For Organizers
- Create and manage events
- Track event registrations and attendees
- Dashboard with event analytics
- Online and offline event support
- Paid event management

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with credentials provider
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd event-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your database URL and other required environment variables.

4. Set up the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Database Schema

The application uses the following main entities:

- **Users**: Store user information with roles (attendee/organizer)
- **Events**: Event details including date, location, pricing
- **UsersToEvents**: Many-to-many relationship for event registrations
- **Payments**: Track payment information for paid events

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── api/               # API routes
│   ├── dashboard/         # User dashboard
│   ├── events/            # Event pages
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/               # UI primitives
│   ├── event-card.tsx    # Event display component
│   └── navbar.tsx        # Navigation component
├── drizzle/              # Database configuration
│   ├── schemas/          # Database schemas
│   ├── db.ts            # Database connection
│   └── schema.ts        # Schema exports
├── lib/                  # Utility functions
│   ├── auth.ts          # NextAuth configuration
│   └── utils.ts         # Helper functions
└── types/               # TypeScript type definitions
```

## Key Features Implementation

### Authentication
- Custom credentials provider with bcrypt password hashing
- Role-based access control (attendee/organizer)
- Protected routes and API endpoints

### Event Management
- Create events with rich details (online/offline, free/paid)
- Event registration system
- Organizer dashboard with analytics

### User Experience
- Responsive design with mobile-first approach
- Search and filter functionality
- Real-time event updates

## API Routes

- `POST /api/auth/register` - User registration
- `POST /api/events` - Create new event
- `GET /api/events` - List events with filters

## Environment Variables

Required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for NextAuth.js
- `NEXTAUTH_URL` - Application URL

Optional:
- Cloudinary credentials for image uploads
- Stripe credentials for payment processing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.