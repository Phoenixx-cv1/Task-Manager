import React, { useState, useEffect } from 'react';
import './styles.css';

const API_URL = 'http://127.0.0.1:8000';

function App() {
  // State variables
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [view, setView] = useState('login'); // 'login' or 'register'
  
  // Form inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load tasks on mount if logged in
  useEffect(() => {
    if (token && user) {
      fetchTasks();
      if (user.role === 'admin') {
        fetchUsers();
      }
    }
  }, [token, user]);

  // Login function
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        setToken(data.access_token);
        setUser({ username: data.username, role: data.role });
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify({ username: data.username, role: data.role }));
        setUsername('');
        setPassword('');
      } else {
        setError(data.detail || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Make sure backend is running.');
    }
  };

  // Register function
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Registration successful! Please login.');
        setView('login');
        setUsername('');
        setPassword('');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.detail || 'Registration failed');
      }
    } catch (err) {
      setError('Connection error. Make sure backend is running.');
    }
  };

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const endpoint = user?.role === 'admin' ? '/admin/tasks' : '/tasks/';
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  // Fetch users (admin only)
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Create task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/task/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: newTaskTitle, description: newTaskDesc, completed: false })
      });

      if (response.ok) {
        setSuccess('Task created successfully!');
        setNewTaskTitle('');
        setNewTaskDesc('');
        fetchTasks();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to create task');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  // Update task (admin only)
  const handleUpdateTask = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/task/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editingTask.title,
          description: editingTask.description,
          completed: editingTask.completed
        })
      });

      if (response.ok) {
        setSuccess('Task updated!');
        setEditingTask(null);
        fetchTasks();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Update failed');
    }
  };

  // Delete task (admin only)
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    
    try {
      const response = await fetch(`${API_URL}/admin/task/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSuccess('Task deleted!');
        fetchTasks();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Delete failed');
    }
  };

  // Delete user (admin only)
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user and all their tasks?')) return;
    
    try {
      const response = await fetch(`${API_URL}/admin/user/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSuccess('User deleted!');
        fetchUsers();
        fetchTasks();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Delete failed');
    }
  };

  // Logout
  const handleLogout = () => {
    setToken('');
    setUser(null);
    setTasks([]);
    setUsers([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Render Login/Register Page
  if (!token) {
    return (
      <div className="container">
        <div className="card">
          <h1>🏦 Task Management</h1>
          
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <div className="tabs">
            <button 
              className={view === 'login' ? 'tab active' : 'tab'}
              onClick={() => setView('login')}
            >
              Login
            </button>
            <button 
              className={view === 'register' ? 'tab active' : 'tab'}
              onClick={() => setView('register')}
            >
              Register
            </button>
          </div>

          <form onSubmit={view === 'login' ? handleLogin : handleRegister}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary">
              {view === 'login' ? 'Login' : 'Register'}
            </button>
          </form>

          {view === 'register' && (
            <p className="info">All new accounts are created as 'User' role</p>
          )}
        </div>
      </div>
    );
  }

  // Render User Dashboard
  if (user.role === 'user') {
    return (
      <div className="container">
        <div className="header">
          <h2>👤 Welcome, {user.username}</h2>
          <button onClick={handleLogout} className="btn-secondary">Logout</button>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <div className="card">
          <h3>Create New Task</h3>
          <form onSubmit={handleCreateTask}>
            <input
              type="text"
              placeholder="Task Title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
            />
            <button type="submit" className="btn-primary">Create Task</button>
          </form>
        </div>

        <div className="card">
          <h3>My Tasks ({tasks.length})</h3>
          {tasks.length === 0 ? (
            <p>No tasks yet. Create your first task!</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td>{task.description || '-'}</td>
                    <td>{task.completed ? '✅ Done' : '⏳ Pending'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="info">To update or delete tasks, contact admin</p>
        </div>
      </div>
    );
  }

  // Render Admin Dashboard
  return (
    <div className="container">
      <div className="header">
        <h2>👑 Admin Dashboard - {user.username}</h2>
        <button onClick={handleLogout} className="btn-secondary">Logout</button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="card">
        <h3>All Users ({users.length})</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.role === 'admin' ? '👑 Admin' : '👤 User'}</td>
                <td>
                  {u.username !== user.username && (
                    <button onClick={() => handleDeleteUser(u.id)} className="btn-danger">
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>All Tasks ({tasks.length})</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Owner ID</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.id}>
                <td>{task.id}</td>
                <td>{task.title}</td>
                <td>{task.description || '-'}</td>
                <td>{task.owner_id}</td>
                <td>{task.completed ? '✅ Done' : '⏳ Pending'}</td>
                <td>
                  <button onClick={() => setEditingTask(task)} className="btn-primary">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteTask(task.id)} className="btn-danger">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingTask && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit Task #{editingTask.id}</h3>
            <input
              type="text"
              value={editingTask.title}
              onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
            />
            <input
              type="text"
              value={editingTask.description}
              onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
            />
            <label>
              <input
                type="checkbox"
                checked={editingTask.completed}
                onChange={(e) => setEditingTask({...editingTask, completed: e.target.checked})}
              />
              Completed
            </label>
            <div>
              <button onClick={handleUpdateTask} className="btn-primary">Save</button>
              <button onClick={() => setEditingTask(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
