import { db } from '@/drizzle/db'
import { events } from '@/drizzle/schemas/events'
import { users } from '@/drizzle/schemas/user.schema'
import { usersToEvents } from '@/drizzle/schemas/usersToEvents'
import { EventCard } from '@/components/event-card'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { eq, desc, count, sql, ilike, or, gte } from 'drizzle-orm'
import { Search, Filter } from 'lucide-react'

interface EventsPageProps {
  searchParams: {
    search?: string
    filter?: 'upcoming' | 'past' | 'all'
  }
}

const EventsPage = async ({ searchParams }: EventsPageProps) => {
  const search = searchParams.search || ''
  const filter = searchParams.filter || 'upcoming'

  // Build query conditions
  let whereConditions = []
  
  if (search) {
    whereConditions.push(
      or(
        ilike(events.title, `%${search}%`),
        ilike(events.description, `%${search}%`),
        ilike(events.location, `%${search}%`)
      )
    )
  }

  if (filter === 'upcoming') {
    whereConditions.push(gte(events.date, new Date()))
  } else if (filter === 'past') {
    whereConditions.push(sql`${events.date} < ${new Date()}`)
  }

  // Get events with organizer info and attendee count
  const allEvents = await db
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
    .where(whereConditions.length > 0 ? sql`${whereConditions.join(' AND ')}` : undefined)
    .groupBy(events.id, users.id)
    .orderBy(desc(events.date))

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Browse Events</h1>
          
          {/* Search and Filter */}
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                defaultValue={search}
                className="pl-10"
                name="search"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant={filter === 'upcoming' ? 'default' : 'outline'}
                size="sm"
              >
                Upcoming
              </Button>
              <Button 
                variant={filter === 'past' ? 'default' : 'outline'}
                size="sm"
              >
                Past
              </Button>
              <Button 
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
              >
                All
              </Button>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {allEvents.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground">
              {search 
                ? `No events match "${search}". Try adjusting your search.`
                : "No events available at the moment."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default EventsPage