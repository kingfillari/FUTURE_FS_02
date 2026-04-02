import React, { useState, useEffect } from 'react';
import { fetchNotes, addNote, deleteNote } from '../api';

const NotesModal = ({ lead, onClose, onNoteChange }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNoteText, setNewNoteText] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const data = await fetchNotes(lead._id);
        if (data.success) {
          setNotes(data.data);
        } else {
          setError('Failed to load notes');
        }
      } catch (err) {
        console.error(err);
        setError('Error loading notes');
      } finally {
        setLoading(false);
      }
    };
    loadNotes();
  }, [lead._id]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) {
      setError('Note text cannot be empty');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const data = await addNote(lead._id, newNoteText, followUpDate || null);
      if (data.success) {
        setNotes(prev => [data.data, ...prev]);
        setNewNoteText('');
        setFollowUpDate('');
        if (onNoteChange) onNoteChange(); // refresh lead table maybe
      } else {
        setError(data.message || 'Failed to add note');
      }
    } catch (err) {
      console.error(err);
      setError('Error adding note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      const data = await deleteNote(noteId);
      if (data.success) {
        setNotes(prev => prev.filter(note => note._id !== noteId));
      } else {
        alert('Delete failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting note');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Notes for {lead.name}</h3>
        <p style={{ marginBottom: '1rem', color: '#555' }}>{lead.email}</p>

        <form onSubmit={handleAddNote} style={styles.form}>
          <textarea
            rows="3"
            placeholder="Write a note..."
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            style={styles.textarea}
            required
          />
          <input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            style={styles.dateInput}
          />
          <button type="submit" disabled={submitting} style={styles.addBtn}>
            {submitting ? 'Adding...' : '+ Add Note'}
          </button>
        </form>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <div className="loading">Loading notes...</div>
        ) : notes.length === 0 ? (
          <p>No notes yet. Add one above.</p>
        ) : (
          <div style={styles.notesList}>
            {notes.map(note => (
              <div key={note._id} style={styles.noteItem}>
                <div style={styles.noteHeader}>
                  <span style={styles.noteDate}>
                    {new Date(note.createdAt).toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleDeleteNote(note._id)}
                    style={styles.deleteNoteBtn}
                  >
                    🗑️
                  </button>
                </div>
                <p style={styles.noteText}>{note.noteText}</p>
                {note.followUpDate && (
                  <small style={styles.followUp}>
                    Follow‑up: {new Date(note.followUpDate).toLocaleDateString()}
                  </small>
                )}
              </div>
            ))}
          </div>
        )}

        <button onClick={onClose} style={styles.closeBtn}>Close</button>
      </div>
    </div>
  );
};

const styles = {
  form: {
    marginBottom: '1.5rem',
  },
  textarea: {
    width: '100%',
    padding: '8px',
    marginBottom: '10px',
    fontFamily: 'inherit',
  },
  dateInput: {
    width: '100%',
    marginBottom: '10px',
  },
  addBtn: {
    width: '100%',
  },
  notesList: {
    maxHeight: '300px',
    overflowY: 'auto',
    marginBottom: '1rem',
  },
  noteItem: {
    background: '#f9f9f9',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '10px',
    border: '1px solid #eee',
  },
  noteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  noteDate: {
    fontSize: '0.7rem',
    color: '#888',
  },
  deleteNoteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '0 4px',
    color: '#999',
  },
  noteText: {
    margin: '5px 0',
    fontSize: '0.9rem',
  },
  followUp: {
    color: '#007bff',
    fontSize: '0.7rem',
  },
  closeBtn: {
    background: '#6c757d',
    width: '100%',
    marginTop: '10px',
  },
};

export default NotesModal;