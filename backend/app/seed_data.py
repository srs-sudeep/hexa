from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Page

def seed_pages():
    """Seed the database with initial page data"""
    db = SessionLocal()
    try:
        # Check if pages already exist
        if db.query(Page).count() > 0:
            print("Pages already exist, skipping seed")
            return
        
        pages_data = [
            {
                "name": "users",
                "route": "/users",
                "description": "Manage users, view user list, create new users",
                "api_endpoints": {
                    "get": "/api/users",
                    "post": "/api/users"
                }
            },
            {
                "name": "roles",
                "route": "/roles", 
                "description": "Manage roles and permissions, create new roles",
                "api_endpoints": {
                    "get": "/api/roles",
                    "post": "/api/roles"
                }
            }
        ]
        
        for page_data in pages_data:
            page = Page(**page_data)
            db.add(page)
        
        db.commit()
        print("Successfully seeded pages data")
        
    except Exception as e:
        print(f"Error seeding pages: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_pages()
