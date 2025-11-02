"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export function EventsSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [filter, setFilter] = useState(searchParams.get('filter') || 'upcoming')

  const updateURL = (newSearch: string, newFilter: string) => {
    const params = new URLSearchParams()
    if (newSearch) params.set('search', newSearch)
    if (newFilter !== 'upcoming') params.set('filter', newFilter)
    
    const queryString = params.toString()
    router.push(`/events${queryString ? `?${queryString}` : ''}`)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateURL(search, filter)
  }

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter)
    updateURL(search, newFilter)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearchSubmit} className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events by title, description, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 hover-lift"
          />
        </div>
        <Button type="submit" className="hover-lift">
          Search
        </Button>
      </form>
      
      <div className="flex gap-2 flex-wrap">
        <Button 
          variant={filter === 'upcoming' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange('upcoming')}
          className="hover-lift"
        >
          Upcoming
        </Button>
        <Button 
          variant={filter === 'past' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange('past')}
          className="hover-lift"
        >
          Past Events
        </Button>
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange('all')}
          className="hover-lift"
        >
          All Events
        </Button>
      </div>
    </div>
  )
}