from pydantic import BaseModel
from typing import Optional


class UserCreate(BaseModel):
  username: str
  password: str

class UserResponse(BaseModel):
  id: int
  username: str
  role: str
  class Config:
    from_attributes=True
#Request/Response Models
class TaskCreate(BaseModel):
  title: str
  description: str
  completed:bool= False
  
class TaskResponse(BaseModel):
  id:int
  title: str
  description: str
  completed: bool
  owner_id:int
  class Config:
    from_attributes= True
  