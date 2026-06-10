import React, { useState, useCallback } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { TicketCategory, TicketPriority, TicketStatus, TicketFilter } from '../types';

interface FilterBarProps {
  onFilterChange: (filters: TicketFilter) => void;
  showDateRange?: boolean;
}

export const TicketFilterBar: React.FC<FilterBarProps> = ({
  onFilterChange,
  showDateRange = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | ''>('');
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleFilterChange = useCallback(() => {
    const filters: TicketFilter = {
      searchQuery: searchQuery || undefined,
      category: selectedCategory ? (selectedCategory as TicketCategory) : undefined,
      priority: selectedPriority ? (selectedPriority as TicketPriority) : undefined,
      status: selectedStatus ? (selectedStatus as TicketStatus) : undefined,
    };

    if (startDate && endDate) {
      filters.dateRange = { startDate, endDate };
    }

    onFilterChange(filters);
  }, [
    searchQuery,
    selectedCategory,
    selectedPriority,
    selectedStatus,
    startDate,
    endDate,
    onFilterChange,
  ]);

  React.useEffect(() => {
    handleFilterChange();
  }, [
    searchQuery,
    selectedCategory,
    selectedPriority,
    selectedStatus,
    startDate,
    endDate,
  ]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Ticket ID, Name, or Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as TicketCategory | '')}
            className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {Object.values(TicketCategory).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as TicketPriority | '')}
            className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priorities</option>
            {Object.values(TicketPriority).map((pri) => (
              <option key={pri} value={pri}>
                {pri}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as TicketStatus | '')}
            className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {Object.values(TicketStatus).map((stat) => (
              <option key={stat} value={stat}>
                {stat}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('');
              setSelectedPriority('');
              setSelectedStatus('');
              setStartDate('');
              setEndDate('');
            }}
            className="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>

        {/* Date Range Filter */}
        {showDateRange && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

