import React, { useState, useEffect, useCallback } from 'react';
import { fetchLeads, updateLeadStatus, deleteLead } from '../api';
import NotesModal from './NotesModal';

const LeadTable = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showNotesModal, setShowNotesModal] = useState(false);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        status: filters.status || undefined,
        search: filters.search || undefined,
        sortBy,
        order,
        page,
        limit: 10,
      };
      const data = await fetchLeads(params);
      if (data.success) {
        setLeads(data.data);
        setTotalPages(data.pagination.pages);
      } else {
        setError('Failed to load leads');
      }
    } catch (err) {
      console.error(err);
      setError('Error fetching leads. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, order, page]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      const data = await updateLeadStatus(leadId, newStatus);
      if (data.success) {
        // Update local state
        setLeads(prev =>
          prev.map(lead =>
            lead._id === leadId ? { ...lead, status: newStatus } : lead
          )
        );
      } else {
        alert('Status update failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Are you sure you want to delete this lead? All associated notes will also be deleted.')) return;
    try {
      const data = await deleteLead(leadId);
      if (data.success) {
        setLeads(prev => prev.filter(lead => lead._id !== leadId));
      } else {
        alert('Delete failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting lead');
    }
  };

  const openNotes = (lead) => {
    setSelectedLead(lead);
    setShowNotesModal(true);
  };

  const closeNotesModal = () => {
    setShowNotesModal(false);
    setSelectedLead(null);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('asc');
    }
    setPage(1);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'new': return 'status-new';
      case 'contacted': return 'status-contacted';
      case 'converted': return 'status-converted';
      default: return '';
    }
  };

  if (loading && page === 1) return <div className="loading">Loading leads...</div>;

  return (
    <div className="container">
      <h2>Lead Management</h2>
      {/* Filters */}
      <div style={styles.filters}>
        <select name="status" value={filters.status} onChange={handleFilterChange} style={styles.filterSelect}>
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
        </select>
        <input
          type="text"
          name="search"
          placeholder="Search by name or email"
          value={filters.search}
          onChange={handleFilterChange}
          style={styles.searchInput}
        />
      </div>

      {error && <div className="error">{error}</div>}

      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort('name')} style={styles.sortable}>Name {sortBy === 'name' && (order === 'asc' ? '↑' : '↓')}</th>
            <th onClick={() => handleSort('email')} style={styles.sortable}>Email {sortBy === 'email' && (order === 'asc' ? '↑' : '↓')}</th>
            <th>Source</th>
            <th onClick={() => handleSort('status')} style={styles.sortable}>Status {sortBy === 'status' && (order === 'asc' ? '↑' : '↓')}</th>
            <th onClick={() => handleSort('createdAt')} style={styles.sortable}>Created {sortBy === 'createdAt' && (order === 'asc' ? '↑' : '↓')}</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.length === 0 ? (
            <tr><td colSpan="6" style={{ textAlign: 'center' }}>No leads found</td></tr>
          ) : (
            leads.map(lead => (
              <tr key={lead._id}>
                <td>{lead.name}</td>
                <td>{lead.email}</td>
                <td>{lead.source}</td>
                <td>
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                    className={`status-badge ${getStatusClass(lead.status)}`}
                    style={styles.statusSelect}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="converted">Converted</option>
                  </select>
                </td>
                <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => openNotes(lead)} style={styles.smallBtn}>📝 Notes</button>
                  <button onClick={() => handleDeleteLead(lead._id)} style={{ ...styles.smallBtn, ...styles.dangerBtn }}>🗑️ Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button disabled={page === 1} onClick={() => setPage(p => p-1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p+1)}>Next</button>
        </div>
      )}

      {showNotesModal && selectedLead && (
        <NotesModal lead={selectedLead} onClose={closeNotesModal} onNoteChange={loadLeads} />
      )}
    </div>
  );
};

const styles = {
  filters: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
  },
  filterSelect: {
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    minWidth: '150px',
  },
  searchInput: {
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    flex: 1,
    minWidth: '200px',
  },
  sortable: {
    cursor: 'pointer',
    userSelect: 'none',
  },
  statusSelect: {
    background: 'transparent',
    border: 'none',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  smallBtn: {
    padding: '4px 8px',
    fontSize: '12px',
    marginRight: '8px',
  },
  dangerBtn: {
    background: '#dc3545',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginTop: '2rem',
    alignItems: 'center',
  },
};

export default LeadTable;