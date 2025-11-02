import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/drizzle/db'
import { events } from '@/drizzle/schemas/events'
import { usersToEvents } from '@/drizzle/schemas/usersToEvents'
import { eq, and } from 'drizzle-orm'

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

    // Check if event exists and is free
    const eventResult = await db
      .select({
        id: events.id,
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

    if (event.isPaid) {
      return NextResponse.json({ message: 'This is a paid event. Use payment flow.' }, { status: 400 })
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

    // Register user for free event
    await db.insert(usersToEvents).values({
      eventId: id,
      userId: session.user.id,
    })

    return NextResponse.json({ message: 'Successfully registered for event' }, { status: 201 })
  } catch (error) {
    console.error('Error registering for event:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}