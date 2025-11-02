import { db } from '@/drizzle/db'
import { events } from '@/drizzle/schemas/events'
import { users } from '@/drizzle/schemas/user.schema'
import { usersToEvents } from '@/drizzle/schemas/usersToEvents'
import { EventCard } from '@/components/event-card'
import { Navbar } from '@/components/navbar'
import { EventsSearch } from '@/components/events-search'
import { eq, desc, count, sql, ilike, or, gte } from 'drizzle-orm'
import { Search } from 'lucide-react'
import { Suspense } from 'react'

interface EventsPageProps {
  searchParams: {
    search?: string
    filter?: 'upcoming' | 'past' | 'all'
  }
}

const EventsPage = async ({ searchParams }: EventsPageProps) => {
  const search = searchParams.search || ''
  const filter = searchParams.filter || 'upcoming'

  // Build where condition
  let whereCondition = undefined

  if (search && filter !== 'all') {
    if (filter === 'upcoming') {
      whereCondition = sql`(${ilike(events.title, `%${search}%`)} OR ${ilike(events.description, `%${search}%`)} OR ${ilike(events.location, `%${search}%`)}) AND ${events.date} >= ${new Date()}`
    } else if (filter === 'past') {
      whereCondition = sql`(${ilike(events.title, `%${search}%`)} OR ${ilike(events.description, `%${search}%`)} OR ${ilike(events.location, `%${search}%`)}) AND ${events.date} < ${new Date()}`
    }
  } else if (search) {
    whereCondition = or(
      ilike(events.title, `%${search}%`),
      ilike(events.description, `%${search}%`),
      ilike(events.location, `%${search}%`)
    )
  } else if (filter === 'upcoming') {
    whereCondition = gte(events.date, new Date())
  } else if (filter === 'past') {
    whereCondition = sql`${events.date} < ${new Date()}`
  }

  // Get events with organizer info and attendee count
  let query = db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      date: events.date,
      time: events.time,
      location: events.location,
      image: events.image,
      isOnline: events.isOnline,
      price: events.price,
      isPaid: events.isPaid,
      organizer: {
        name: users.name,
        organizationName: users.organizationName,
      },
      _count: {
        attendees: count(usersToEvents.userId),
      },
    })
    .from(events)
    .leftJoin(users, eq(events.organizerId, users.id))
    .leftJoin(usersToEvents, eq(events.id, usersToEvents.eventId))
    .groupBy(events.id, users.id)

  // Apply where condition if exists
  if (whereCondition) {
    query = query.where(whereCondition)
  }

  const allEvents = await query.orderBy(desc(events.date))

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold mb-6 gradient-text">Browse Events</h1>
          <Suspense fallback={
            <div className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[300px] h-10 bg-muted animate-pulse rounded"></div>
                <div className="w-20 h-10 bg-muted animate-pulse rounded"></div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <div className="w-20 h-8 bg-muted animate-pulse rounded"></div>
                <div className="w-24 h-8 bg-muted animate-pulse rounded"></div>
                <div className="w-20 h-8 bg-muted animate-pulse rounded"></div>
              </div>
            </div>
          }>
            <EventsSearch />
          </Suspense>
        </div>

        {/* Events Grid */}
        {allEvents.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allEvents.map((event, index) => (
              <div
                key={event.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <EventCard event={event} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 animate-fade-in">
            <div className="bg-muted/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {search
                ? `No events match "${search}". Try adjusting your search terms or browse all events.`
                : "No events available at the moment. Check back soon for exciting new events!"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default EventsPage