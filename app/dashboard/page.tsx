import { db } from '@/drizzle/db'
import { events } from '@/drizzle/schemas/events'
import { users } from '@/drizzle/schemas/user.schema'
import { usersToEvents } from '@/drizzle/schemas/usersToEvents'
import { Navbar } from '@/components/navbar'
import { EventCard } from '@/components/event-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { eq, desc, count, gte } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Users, Plus, TicketCheck } from 'lucide-react'

const DashboardPage = async () => {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const userId = session.user.id
  const isOrganizer = session.user.role === 'organizer'

  // Get user's registered events (for attendees)
  const registeredEvents = await db
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
      registeredAt: usersToEvents.registeredAt,
      checkedIn: usersToEvents.checkedIn,
    })
    .from(usersToEvents)
    .leftJoin(events, eq(usersToEvents.eventId, events.id))
    .leftJoin(users, eq(events.organizerId, users.id))
    .where(eq(usersToEvents.userId, userId))
    .orderBy(desc(events.date))

  // Get organizer's events (for organizers)
  let organizedEvents = []
  let eventStats = { total: 0, upcoming: 0, totalAttendees: 0 }
  
  if (isOrganizer) {
    organizedEvents = await db
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
      .where(eq(events.organizerId, userId))
      .groupBy(events.id, users.id)
      .orderBy(desc(events.date))

    // Calculate stats
    eventStats.total = organizedEvents.length
    eventStats.upcoming = organizedEvents.filter(e => new Date(e.date) > new Date()).length
    eventStats.totalAttendees = organizedEvents.reduce((sum, e) => sum + (e._count?.attendees || 0), 0)
  }

  const upcomingRegistered = registeredEvents.filter(e => new Date(e.date) > new Date())

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session.user.name}!
          </p>
        </div>

        {isOrganizer ? (
          /* Organizer Dashboard */
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{eventStats.total}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                  <TicketCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{eventStats.upcoming}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{eventStats.totalAttendees}</div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your events and create new ones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button asChild>
                    <Link href="/dashboard/events/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Event
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/events">
                      Manage Events
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Events */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Your Events</h2>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/events">View All</Link>
                </Button>
              </div>
              
              {organizedEvents.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {organizedEvents.slice(0, 6).map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No events yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first event to get started!
                    </p>
                    <Button asChild>
                      <Link href="/dashboard/events/create">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Event
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          /* Attendee Dashboard */
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Registered Events</CardTitle>
                  <TicketCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{registeredEvents.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{upcomingRegistered.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Discover Events</CardTitle>
                <CardDescription>Find and join amazing events</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/events">
                    Browse All Events
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Registered Events */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Your Registered Events</h2>
              
              {registeredEvents.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {registeredEvents.map((event) => (
                    <div key={event.id} className="relative">
                      <EventCard event={event} />
                      {event.checkedIn && (
                        <Badge className="absolute top-2 right-2">
                          Checked In
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <TicketCheck className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No events registered</h3>
                    <p className="text-muted-foreground mb-4">
                      Start exploring and register for events that interest you!
                    </p>
                    <Button asChild>
                      <Link href="/events">
                        Browse Events
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage