from upauth import get_db, get_current_user, SECRET_KEY, ALGORITHM 
from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session
from updatabase import engine, Base, SessionLocal
from upmodels import User, Task
from upschemas import UserCreate, TaskCreate, TaskResponse
from passlib.hash import sha256_crypt
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from typing import List
from fastapi.middleware.cors import CORSMiddleware

ACCESS_TOKEN_EXPIRE_MINUTES=30
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# --- FastAPI instance ---
app = FastAPI(title="TaskFlow - Task Manager API")

# --- Enable CORS ---
origins = [
    "http://localhost:3000",  # React default port
    "http://127.0.0.1:3000",
    "https://taskflow-frontend-2om7.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # Which domains can access your API
    allow_credentials=True,
    allow_methods=["*"],        # Allow all HTTP methods (GET, POST, PUT, DELETE)
    allow_headers=["*"],        # Allow all headers
)
# --- Create DB tables ---
Base.metadata.create_all(bind=engine)

# --- Root endpoint ---
@app.get("/")
def root():
    return {
        "message": "Welcome to TaskFlow API",
        "version": "1.0",
        "endpoints": {
            "documentation": "/docs",
            "register": "/register",
            "login": "/login",
            "create_task": "/task/",
            "get_my_tasks": "/tasks/",
            "stats": "/stats",
            "admin_endpoints": {
                "all_users": "/admin/users",
                "all_tasks": "/admin/tasks",
                "update_task": "/admin/task/{task_id}",
                "delete_task": "/admin/task/{task_id}",
                "delete_user": "/admin/user/{user_id}"
            }
        }
    }

# --- DB dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Password helpers ---
def get_password_hash(password: str):
    return sha256_crypt.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return sha256_crypt.verify(plain_password, hashed_password)

# --- JWT helpers ---
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user
 
def admin_required(current_user:User= Depends(get_current_user)):
    if current_user.role!="admin":
       raise HTTPException(status_code=403,detail="Admin access required")
    return current_user

# --- Register endpoint ---
@app.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        if not user.username or not user.password:
            raise HTTPException(status_code=400, detail="Username and password required")

        existing_user = db.query(User).filter(User.username == user.username).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already registered")
        
        # Force all new registrations to be 'user' role only
        hashed_password = get_password_hash(user.password)
        new_user = User(username=user.username, hashed_password=hashed_password, role="user")
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"message": f"User {user.username} registered successfully", "role": new_user.role}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")

# --- Login endpoint ---
@app.post("/login")
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # find user
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # create JWT access token with role
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username
    }

# --- Task CRUD endpoints ---
# Create Task
@app.post("/task/", response_model=TaskResponse)
def create_task(task: TaskCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_task = Task(**task.dict(), owner_id=current_user.id)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

# Get My Tasks (Read-only for users)
@app.get("/tasks/", response_model=List[TaskResponse])
def get_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        raise HTTPException(status_code=403, detail="Admin should use /admin/tasks endpoint")
    return db.query(Task).filter(Task.owner_id == current_user.id).all()

# Update Task (Admin only)
@app.put("/admin/task/{task_id}", response_model=TaskResponse, dependencies=[Depends(admin_required)])
def update_task(task_id: int, updated_task: TaskCreate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.title = updated_task.title
    task.description = updated_task.description
    task.completed = updated_task.completed
    db.commit()
    db.refresh(task)
    return task

# Delete Task (Admin only)
@app.delete("/admin/task/{task_id}", dependencies=[Depends(admin_required)])
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}
    
@app.get("/admin/users", dependencies=[Depends(admin_required)])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"id": u.id, "username": u.username, "role": u.role} for u in users]

@app.delete("/admin/user/{user_id}", dependencies=[Depends(admin_required)])
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Delete all tasks associated with this user
    db.query(Task).filter(Task.owner_id == user_id).delete()
    db.delete(user)
    db.commit()
    return {"message": f"User {user.username} and all associated tasks deleted successfully"}

@app.get("/admin/tasks", dependencies=[Depends(admin_required)])
def get_all_tasks(db:Session= Depends(get_db)):
   return db.query(Task).all()
   
@app.get("/stats")
def get_task_stats(db: Session= Depends(get_db), current_user: User= Depends(get_current_user)):
    query= db.query(Task)
    if current_user.role!= "admin":
       query= query.filter(Task.owner_id== current_user.id)
    total_tasks= query.count()
    completed_tasks=query.filter(Task.completed==True).count()
    pending_tasks= total_tasks-completed_tasks
    return{"role": current_user.role,"total_tasks":total_tasks,"completed_tasks":completed_tasks,"pending_tasks":pending_tasks,"completion_rate":f"{(completed_tasks/total_tasks *100) if total_tasks>00 else 0:.2f}%",}
    
