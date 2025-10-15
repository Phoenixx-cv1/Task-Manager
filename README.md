# TaskFlow - Task Management System

A full-stack web application for managing tasks with role-based access control. Users can create and view their tasks, while admins have full control over all users and tasks.

## 🎯 Features

### User Features
- User registration and authentication
- Create new tasks with title and description
- View personal task list (read-only)
- Track task completion status
- View task statistics

### Admin Features
- View and manage all users
- View and manage all tasks across users
- Edit any task (title, description, status)
- Delete tasks and users
- Access comprehensive task statistics

## 🛠️ Tech Stack

**Backend:**
- FastAPI (Python web framework)
- PostgreSQL (Database)
- SQLAlchemy (ORM)
- JWT (Authentication)
- Passlib (Password hashing)

**Frontend:**
- React.js
- CSS3
- Fetch API

## 📁 Project Structure

```
TaskFlow/
├── backend/
│   ├── upmain.py          
│   ├── upauth.py         
│   ├── updatabase.py      
│   ├── upmodels.py        
│   ├── upschemas.py       
│   ├── create_admin.py    
│   └── requirements.txt   
│
└── frontend/
    ├── src/
    │   ├── App.js         
    │   ├── index.js       
    │   └── styles.css     
    ├── public/
    └── package.json       
```

## 🚀 Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 14+
- PostgreSQL

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Configure database connection in `updatabase.py`

4. Create admin account:
```bash
python create_admin.py
```

5. Start the backend server:
```bash
uvicorn upmain:app --reload
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## 📡 API Endpoints

### Authentication
- `POST /register` - Register new user
- `POST /login` - User login

### Tasks
- `POST /task/` - Create new task
- `GET /tasks/` - Get user's tasks
- `GET /stats` - Get task statistics

### Admin Only
- `GET /admin/users` - View all users
- `GET /admin/tasks` - View all tasks
- `PUT /admin/task/{task_id}` - Update any task
- `DELETE /admin/task/{task_id}` - Delete any task
- `DELETE /admin/user/{user_id}` - Delete user

### Documentation
- `GET /docs` - Interactive API documentation (Swagger UI)

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication:
1. User logs in with credentials
2. Server returns JWT token
3. Token is stored in localStorage
4. Token is sent with each API request in Authorization header
5. Server validates token and grants access based on user role

## 🎨 Key Features Explained

### Role-Based Access Control
The application implements strict role-based permissions. Users are automatically assigned the "user" role on registration. Admin accounts must be created using the `create_admin.py` script.

### Task Statistics
Both users and admins can view statistics including:
- Total tasks
- Completed tasks
- Pending tasks
- Completion rate percentage

### Secure Password Storage
Passwords are hashed using SHA-256 encryption before storage, ensuring user data security.


