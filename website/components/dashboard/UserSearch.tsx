'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface UserSearchProps {
  onSearch: (query: string) => void
  onFilterChange: (filter: string) => void
  onClear: () => void
}

export default function UserSearch({ onSearch, onFilterChange, onClear }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')

  const handleSearch = () => {
    onSearch(searchQuery)
  }

  const handleFilterChange = (value: string) => {
    setSelectedFilter(value)
    onFilterChange(value)
  }

  const handleClear = () => {
    setSearchQuery('')
    setSelectedFilter('all')
    onClear()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full">
      <div className="flex-1 min-w-0">
        <Input
          placeholder="Search users by name, email, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full text-base h-12 px-4 text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
        />
      </div>
      
      <Select value={selectedFilter} onValueChange={handleFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Users</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="recent">Recent</SelectItem>
          <SelectItem value="with-bio">With Bio</SelectItem>
          <SelectItem value="no-bio">No Bio</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex gap-2 flex-shrink-0">
        <Button 
          onClick={handleSearch}
          className="bg-blue-600 hover:bg-blue-700 h-12 px-6 text-base"
        >
          Search
        </Button>
        <Button 
          variant="outline" 
          onClick={handleClear}
          className="h-12 px-6 text-base"
        >
          Clear
        </Button>
      </div>
    </div>
  )
}
