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
    const { userId } = await request.json()
    const { id } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'organizer') {
      return NextResponse.json({ message: 'Only organizers can check in attendees' }, { status: 403 })
    }

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 })
    }

    // Verify event exists and user is the organizer
    const eventResult = await db
      .select({
        organizerId: events.organizerId,
      })
      .from(events)
      .where(eq(events.id, id))
      .limit(1)

    if (eventResult.length === 0) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    if (eventResult[0].organizerId !== session.user.id) {
      return NextResponse.json({ message: 'Not authorized to manage this event' }, { status: 403 })
    }

    // Check if user is registered for the event
    const registration = await db
      .select()
      .from(usersToEvents)
      .where(
        and(
          eq(usersToEvents.eventId, id),
          eq(usersToEvents.userId, userId)
        )
      )
      .limit(1)

    if (registration.length === 0) {
      return NextResponse.json({ message: 'User is not registered for this event' }, { status: 404 })
    }

    if (registration[0].checkedIn) {
      return NextResponse.json({ message: 'User is already checked in' }, { status: 400 })
    }

    // Check in the user
    await db
      .update(usersToEvents)
      .set({ checkedIn: true })
      .where(
        and(
          eq(usersToEvents.eventId, id),
          eq(usersToEvents.userId, userId)
        )
      )

    return NextResponse.json({ message: 'User checked in successfully' })
  } catch (error) {
    console.error('Error checking in user:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}