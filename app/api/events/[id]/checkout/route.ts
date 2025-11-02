import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/drizzle/db'
import { events } from '@/drizzle/schemas/events'
import { users } from '@/drizzle/schemas/user.schema'
import { usersToEvents } from '@/drizzle/schemas/usersToEvents'
import { eq, and } from 'drizzle-orm'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'attendee') {
      return NextResponse.json({ message: 'Only attendees can register for events' }, { status: 403 })
    }

    // Get event and user details
    const eventResult = await db
      .select({
        id: events.id,
        title: events.title,
        price: events.price,
        isPaid: events.isPaid,
        date: events.date,
      })
      .from(events)
      .where(eq(events.id, id))
      .limit(1)

    if (eventResult.length === 0) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    const event = eventResult[0]

    if (!event.isPaid) {
      return NextResponse.json({ message: 'This is a free event' }, { status: 400 })
    }

    // Check if event is upcoming
    if (new Date(event.date) <= new Date()) {
      return NextResponse.json({ message: 'Cannot register for past events' }, { status: 400 })
    }

    // Check if already registered
    const existingRegistration = await db
      .select()
      .from(usersToEvents)
      .where(
        and(
          eq(usersToEvents.eventId, id),
          eq(usersToEvents.userId, session.user.id)
        )
      )
      .limit(1)

    if (existingRegistration.length > 0) {
      return NextResponse.json({ message: 'Already registered for this event' }, { status: 400 })
    }

    // Get user details
    const userResult = await db
      .select({
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    if (userResult.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const user = userResult[0]

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: event.title,
              description: `Event registration for ${event.title}`,
            },
            unit_amount: Math.round(parseFloat(event.price) * 100), // Convert to paise
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: user.email,
      metadata: {
        eventId: id,
        userId: session.user.id,
      },
      success_url: `${process.env.NEXTAUTH_URL}/events/${id}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/events/${id}/register`,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}