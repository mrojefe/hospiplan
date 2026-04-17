import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

export function DataTable({
  headers,
  children,
  pagination,
  onPageChange,
  searchable = false,
  searchValue,
  onSearch,
  loading = false,
  emptyMessage = 'Aucune donnée disponible',
}) {
  return (
    <div className="data-table-wrapper">
      {searchable && (
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchValue}
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {headers.map((header, i) => (
                <th key={i}>
                  {header.sortable ? (
                    <button className="th-sortable">
                      {header.label}
                      {header.sortIcon}
                    </button>
                  ) : (
                    header.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={headers.length} className="loading-cell">
                  <div className="table-skeleton">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="skeleton-row" />
                    ))}
                  </div>
                </td>
              </tr>
            ) : children ? (
              children
            ) : (
              <tr>
                <td colSpan={headers.length} className="empty-cell">
                  <div className="empty-state">
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="table-pagination">
          <span className="pagination-info">
            Page {pagination.page} sur {pagination.totalPages}
          </span>
          <div className="pagination-buttons">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
