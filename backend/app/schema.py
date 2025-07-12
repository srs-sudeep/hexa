from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    action_type: str  # "navigate", "create", "show", "general"
    target_page: Optional[str] = None
    route: Optional[str] = None
    api_call: Optional[Dict[str, Any]] = None
    message: str

class UserCreate(BaseModel):
    name: str
    phone_number: str
    email: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    name: str
    phone_number: str
    email: Optional[str]
    created_at: datetime

class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: Optional[List[str]] = None

class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    permissions: Optional[List[str]]
    created_at: datetime

class PageCreate(BaseModel):
    name: str
    route: str
    description: Optional[str] = None
    api_endpoints: Optional[Dict[str, Any]] = None

class PageResponse(BaseModel):
    id: int
    name: str
    route: str
    description: Optional[str]
    api_endpoints: Optional[Dict[str, Any]]
    created_at: datetime