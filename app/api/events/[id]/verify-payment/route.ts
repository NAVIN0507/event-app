import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/drizzle/db'
import { events } from '@/drizzle/schemas/events'
import { usersToEvents } from '@/drizzle/schemas/usersToEvents'
import { payments } from '@/drizzle/schemas/payments'
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
    const { sessionId } = await request.json()
    const { id } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (!sessionId) {
      return NextResponse.json({ message: 'Session ID required' }, { status: 400 })
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json({ message: 'Payment not completed' }, { status: 400 })
    }

    // Verify the session belongs to this user and event
    if (
      checkoutSession.metadata?.userId !== session.user.id ||
      checkoutSession.metadata?.eventId !== id
    ) {
      return NextResponse.json({ message: 'Invalid session' }, { status: 400 })
    }

    // Get event details
    const eventResult = await db
      .select({
        id: events.id,
        title: events.title,
        price: events.price,
      })
      .from(events)
      .where(eq(events.id, id))
      .limit(1)

    if (eventResult.length === 0) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    const event = eventResult[0]

    // Check if already registered (to prevent duplicate registrations)
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

    if (existingRegistration.length === 0) {
      // Register user for the event
      await db.insert(usersToEvents).values({
        eventId: id,
        userId: session.user.id,
      })

      // Record the payment
      await db.insert(payments).values({
        userId: session.user.id,
        eventId: id,
        amount: event.price,
        currency: 'INR',
        stripePaymentId: checkoutSession.payment_intent as string,
        status: 'success',
      })
    }

    return NextResponse.json({ 
      message: 'Payment verified and registration completed',
      eventTitle: event.title
    })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}