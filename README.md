# EventHub

A modern event management platform built with Next.js 15, featuring event discovery, registration, and management capabilities with dark/light theme support.

## Features

### For Attendees
- Browse and search events
- Register for free and paid events
- Secure payment processing with Stripe
- Online event access
- Registration management
- Dark/light theme toggle

### For Organizers
- Create and manage events
- Attendee management and check-in
- Event analytics and statistics
- Revenue tracking
- Event editing and updates

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Styling**: Tailwind CSS with custom animations
- **UI Components**: Radix UI primitives
- **Theme**: next-themes for dark/light mode
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Stripe account for payments

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd event-app
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Fill in your environment variables:
```env
DATABASE_URL=your_postgresql_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

4. Set up the database
```bash
npm run db:push
```

5. Start the development server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── api/               # API routes
│   ├── dashboard/         # Organizer dashboard
│   ├── events/            # Event pages
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/               # UI primitives
│   └── ...               # Feature components
├── drizzle/              # Database schema and config
├── lib/                  # Utility functions
└── types/                # TypeScript type definitions
```

## Database Schema

The application uses the following main entities:

- **Users**: Attendees and organizers with role-based access
- **Events**: Event details, pricing, and metadata
- **Registrations**: User event registrations and check-ins
- **Payments**: Stripe payment tracking

## API Routes

### Events
- `GET /api/events` - List events with filtering
- `GET /api/events/[id]` - Get event details
- `POST /api/events` - Create new event (organizers only)
- `PUT /api/events/[id]` - Update event (organizers only)

### Registration
- `POST /api/events/[id]/register` - Register for free events
- `POST /api/events/[id]/checkout` - Create Stripe checkout session
- `POST /api/events/[id]/verify-payment` - Verify payment completion

### Management
- `GET /api/events/[id]/attendees` - Get attendee list (organizers only)
- `POST /api/events/[id]/check-in` - Check in attendee (organizers only)

## Authentication

The application supports two user roles:

- **Attendee**: Can browse and register for events
- **Organizer**: Can create and manage events, view attendees

Users are automatically assigned the "attendee" role on registration. Organizer access can be granted by updating the user role in the database.

## Payment Processing

Stripe integration handles:
- Secure checkout sessions for paid events
- Webhook processing for payment confirmation
- Automatic registration completion after successful payment

## Deployment

### Environment Setup

Ensure all environment variables are configured for production:
- Database connection string
- NextAuth configuration
- Stripe keys and webhook endpoints

### Build and Deploy

```bash
npm run build
npm start
```

The application can be deployed to platforms like Vercel, Railway, or any Node.js hosting service.

## Development

### Database Changes

When modifying the database schema:

1. Update schema files in `drizzle/schemas/`
2. Push changes to database:
```bash
npm run db:push
```

### Adding New Features

The application follows Next.js 15 conventions:
- Use Server Components by default
- Add "use client" for client-side interactivity
- Implement proper error boundaries
- Follow the established folder structure

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.