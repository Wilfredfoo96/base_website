'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Header() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Search */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="relative flex flex-1 items-center">
          <svg
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
          <Input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
          />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-x-4 lg:gap-x-6">

        {/* Profile dropdown */}
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <div className="hidden lg:block">
            <p className="text-sm font-semibold leading-6 text-gray-900">Welcome back</p>
            <p className="text-xs leading-5 text-gray-500">Ready to get started?</p>
          </div>
        </div>
      </div>
    </header>
  )
}
