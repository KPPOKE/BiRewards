import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, className }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);
    if (currentPage <= 3) end = Math.min(5, totalPages);
    if (currentPage >= totalPages - 2) start = Math.max(1, totalPages - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <nav className={`flex items-center space-x-1 ${className || ''}`} aria-label="Pagination">
      <button
        className="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        aria-label="First Page"
      >«</button>
      <button
        className="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous Page"
      >‹</button>
      {getPageNumbers().map((page) => (
        <button
          key={page}
          className={`px-3 py-1 rounded font-semibold ${page === currentPage ? 'bg-primary-600 text-white shadow' : 'hover:bg-gray-100 text-gray-700'}`}
          onClick={() => onPageChange(page)}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      ))}
      <button
        className="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next Page"
      >›</button>
      <button
        className="px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        aria-label="Last Page"
      >»</button>
    </nav>
  );
};

export default Pagination;
