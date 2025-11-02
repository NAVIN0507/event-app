import { db } from '@/drizzle/db'
import { events } from '@/drizzle/schemas/events'
import { users } from '@/drizzle/schemas/user.schema'
import { usersToEvents } from '@/drizzle/schemas/usersToEvents'
import { EventCard } from '@/components/event-card'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { desc, gte, count, eq } from 'drizzle-orm'
import Link from 'next/link'
import { Calendar, Users, Zap } from 'lucide-react'

const HomePage = async () => {
  // Get upcoming events with organizer info and attendee count
  const upcomingEvents = await db
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
    })
    .from(events)
    .leftJoin(users, eq(events.organizerId, users.id))
    .where(gte(events.date, new Date()))
    .orderBy(events.date)
    .limit(6)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 " />
        <div className="absolute inset-0 border-b" />
        <div className="container mx-auto max-w-4xl relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-slide-up gradient-text">
            Discover Amazing Events
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up" style={{animationDelay: '0.2s'}}>
            Join thousands of people attending incredible events. From workshops to conferences, 
            find your next great experience.
          </p>
          <div className="flex gap-4 justify-center flex-wrap animate-slide-up" style={{animationDelay: '0.4s'}}>
            <Button size="lg" asChild className="hover-lift">
              <Link href="/events">Browse All Events</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="hover-lift glass">
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 animate-slide-up">Why Choose EventHub?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center animate-slide-up hover-lift p-6 rounded-lg transition-all duration-300 hover:bg-muted/50" style={{animationDelay: '0.1s'}}>
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Discovery</h3>
              <p className="text-muted-foreground">
                Find events that match your interests with our intuitive search and filtering.
              </p>
            </div>
            <div className="text-center animate-slide-up hover-lift p-6 rounded-lg transition-all duration-300 hover:bg-muted/50" style={{animationDelay: '0.2s'}}>
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect & Network</h3>
              <p className="text-muted-foreground">
                Meet like-minded people and build meaningful connections at every event.
              </p>
            </div>
            <div className="text-center animate-slide-up hover-lift p-6 rounded-lg transition-all duration-300 hover:bg-muted/50" style={{animationDelay: '0.3s'}}>
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Seamless Experience</h3>
              <p className="text-muted-foreground">
                From registration to check-in, enjoy a smooth and hassle-free experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Upcoming Events</h2>
            <Button variant="outline" asChild>
              <Link href="/events">View All</Link>
            </Button>
          </div>
          
          {upcomingEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event, index) => (
                <div 
                  key={event.id} 
                  className="animate-slide-up" 
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 animate-fade-in">
              <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No upcoming events</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Be the first to create an amazing event and bring people together!
              </p>
              <Button asChild className="hover-lift">
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default HomePage