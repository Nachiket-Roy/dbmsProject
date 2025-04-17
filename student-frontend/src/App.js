import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5010';

function App() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', age: '', gender: '' });
  const [editId, setEditId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStudents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/students`);
      setStudents(res.data);
    } catch (err) {
      setError('Failed to fetch students. Please try again.');
      console.error('Error fetching students:', err);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (editId) {
        // Consistent naming: using student_id instead of mixing id styles
        await axios.put(`${API_URL}/students/${editId}`, form);
      } else {
        // Changed from add_user to students for RESTful consistency
        await axios.post(`${API_URL}/students`, form);
      }
      setForm({ name: '', email: '', age: '', gender: '' });
      setEditId(null);
      fetchStudents();
    } catch (err) {
      setError(`Failed to ${editId ? 'update' : 'add'} student. Please try again.`);
      console.error(`Error ${editId ? 'updating' : 'adding'} student:`, err);
    }
    setIsLoading(false);
  };

  const handleEdit = (student) => {
    setForm({
      name: student.name,
      email: student.email,
      age: student.age,
      gender: student.gender
    });
    setEditId(student.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      setIsLoading(true);
      setError(null);
      try {
        // Changed from delete_user to students for RESTful consistency
        await axios.delete(`${API_URL}/students/${id}`);
        fetchStudents();
      } catch (err) {
        setError('Failed to delete student. Please try again.');
        console.error('Error deleting student:', err);
      }
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({ name: '', email: '', age: '', gender: '' });
    setEditId(null);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <div className="App">
      <h1>Student Manager</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-container">
        <h2>{editId ? 'Edit Student' : 'Add New Student'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input 
              id="name"
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              placeholder="Enter full name" 
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              id="email"
              type="email"
              value={form.email} 
              onChange={(e) => setForm({ ...form, email: e.target.value })} 
              placeholder="Enter email address" 
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="age">Age</label>
            <input 
              id="age"
              type="number" 
              value={form.age} 
              onChange={(e) => setForm({ ...form, age: e.target.value })} 
              placeholder="Enter age" 
              min="1"
              max="120"
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="gender">Gender</label>
            <select 
              id="gender"
              value={form.gender} 
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              required
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
          
          <div className="button-group">
            <button 
              type="submit" 
              className="primary-button"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : editId ? 'Update Student' : 'Add Student'}
            </button>
            
            {editId && (
              <button 
                type="button" 
                className="secondary-button"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="table-container">
        <h2>Student List</h2>
        {isLoading && !students.length ? (
          <p>Loading students...</p>
        ) : students.length === 0 ? (
          <p>No students found. Add a new student above.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.age}</td>
                  <td>{student.gender}</td>
                  <td className="action-buttons">
                    <button 
                      onClick={() => handleEdit(student)}
                      className="edit-button"
                      disabled={isLoading}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(student.id)}
                      className="delete-button"
                      disabled={isLoading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;