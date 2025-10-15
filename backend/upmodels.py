from sqlalchemy import Column,Integer,String,Boolean,ForeignKey
from sqlalchemy.orm import relationship
from updatabase import Base

class User(Base):
  __tablename__="users"
  id= Column(Integer,primary_key=True,index=True)
  username= Column(String,unique=True,index= True)
  hashed_password= Column(String)
  role=Column(String,default="user")
  tasks= relationship("Task",back_populates="owner")
class Task(Base):
  __tablename__="task"
  id= Column(Integer,primary_key=True,index=True)
  title= Column(String,index=True)
  description=Column(String)
  completed=Column(Boolean,default=False)
  owner_id= Column(Integer, ForeignKey("users.id"))
  owner= relationship("User",back_populates="tasks")