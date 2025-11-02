"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Clock, Globe } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface EventCardProps {
  event: {
    id: string
    title: string
    description: string | null
    date: Date
    time: string | null
    location: string | null
    image: string | null
    isOnline: boolean
    price: string
    isPaid: boolean
    organizer: {
      name: string
      organizationName: string | null
    }
    _count?: {
      attendees: number
    }
  }
}

export function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.date)
  const isUpcoming = eventDate > new Date()
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {event.image && (
        <div className="aspect-video relative overflow-hidden">
          <img 
            src={event.image} 
            alt={event.title}
            className="object-cover w-full h-full"
          />
        </div>
      )}
      
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="line-clamp-2">{event.title}</CardTitle>
          <Badge variant={isUpcoming ? "default" : "secondary"}>
            {isUpcoming ? "Upcoming" : "Past"}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {event.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{format(eventDate, "PPP")}</span>
          {event.time && (
            <>
              <Clock className="h-4 w-4 ml-2" />
              <span>{event.time}</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {event.isOnline ? (
            <>
              <Globe className="h-4 w-4" />
              <span>Online Event</span>
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{event.location}</span>
            </>
          )}
        </div>
        
        {event._count && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{event._count.attendees} attendees</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">
            {event.isPaid ? `₹${event.price}` : "Free"}
          </div>
          <div className="text-sm text-muted-foreground">
            by {event.organizer.organizationName || event.organizer.name}
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/events/${event.id}`}>
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}