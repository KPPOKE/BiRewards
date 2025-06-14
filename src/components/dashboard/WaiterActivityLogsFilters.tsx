import React from 'react';

interface WaiterActivityLogsFiltersProps {
  waiterOptions: string[];
  filter: {
    waiter: string;
    startDate: string;
    endDate: string;
  };
  onFilterChange: (filter: {
    waiter: string;
    startDate: string;
    endDate: string;
  }) => void;
  className?: string;
}

const WaiterActivityLogsFilters: React.FC<WaiterActivityLogsFiltersProps> = ({
  waiterOptions,
  filter,
  onFilterChange,
  className = '',
}) => {
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onFilterChange({
      ...filter,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Desktop Filters */}
      <div className="hidden md:flex gap-3 items-end w-full">
        <div>
          <label className="block text-xs font-semibold mb-1">Waiter</label>
          <select
            name="waiter"
            value={filter.waiter}
            onChange={handleInput}
            className="rounded border-gray-300 px-2 py-1 w-32"
          >
            <option value="">All</option>
            {waiterOptions.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={filter.startDate}
            onChange={handleInput}
            className="rounded border-gray-300 px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">End Date</label>
          <input
            type="date"
            name="endDate"
            value={filter.endDate}
            onChange={handleInput}
            className="rounded border-gray-300 px-2 py-1"
          />
        </div>
      </div>
      {/* Mobile Filters */}
      <div className="md:hidden mb-2">
        <button
          className="px-3 py-1 rounded bg-primary-600 text-white font-semibold shadow-md"
          onClick={() => setShowMobileFilters((v) => !v)}
        >
          {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
        {showMobileFilters && (
          <div className="mt-2 flex flex-col gap-2 bg-white rounded shadow p-3 border border-gray-100">
            <label className="text-xs font-semibold">Waiter</label>
            <select
              name="waiter"
              value={filter.waiter}
              onChange={handleInput}
              className="rounded border-gray-300 px-2 py-1"
            >
              <option value="">All</option>
              {waiterOptions.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
            <label className="text-xs font-semibold">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filter.startDate}
              onChange={handleInput}
              className="rounded border-gray-300 px-2 py-1"
            />
            <label className="text-xs font-semibold">End Date</label>
            <input
              type="date"
              name="endDate"
              value={filter.endDate}
              onChange={handleInput}
              className="rounded border-gray-300 px-2 py-1"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default WaiterActivityLogsFilters;
