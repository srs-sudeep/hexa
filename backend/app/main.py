from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from app.qdrant_handler import search_qdrant, initialize_qdrant
from app.llm_handler import query_ollama
from app.database import get_db, create_tables
from app.models import User, Role, Page
from app.schema import (
    ChatRequest, ChatResponse, UserCreate, UserResponse, 
    RoleCreate, RoleResponse, PageCreate, PageResponse
)
from app.seed_data import seed_pages

app = FastAPI(title="Dashboard AI Agent API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize database and Qdrant on startup"""
    create_tables()
    seed_pages()
    initialize_qdrant()

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """AI agent chat endpoint"""
    query = request.query
    context = search_qdrant(query)
    llm_response = query_ollama(context, query)
    
    return ChatResponse(
        action_type=llm_response.get("action_type", "general"),
        target_page=llm_response.get("target_page"),
        route=llm_response.get("route"),
        api_call=llm_response.get("api_call"),
        message=llm_response.get("message", "I'm here to help!")
    )

# User endpoints
@app.get("/api/users", response_model=List[UserResponse])
async def get_users(db: Session = Depends(get_db)):
    """Get all users"""
    users = db.query(User).all()
    return users

@app.post("/api/users", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    db_user = User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Role endpoints
@app.get("/api/roles", response_model=List[RoleResponse])
async def get_roles(db: Session = Depends(get_db)):
    """Get all roles"""
    roles = db.query(Role).all()
    return roles

@app.post("/api/roles", response_model=RoleResponse)
async def create_role(role: RoleCreate, db: Session = Depends(get_db)):
    """Create a new role"""
    db_role = Role(**role.dict())
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

# Page management endpoints
@app.get("/api/pages", response_model=List[PageResponse])
async def get_pages(db: Session = Depends(get_db)):
    """Get all pages"""
    pages = db.query(Page).all()
    return pages

@app.post("/api/pages", response_model=PageResponse)
async def create_page(page: PageCreate, db: Session = Depends(get_db)):
    """Create a new page"""
    db_page = Page(**page.dict())
    db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page