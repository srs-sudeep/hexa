from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer
import uuid
import time

# Initialize clients
client = QdrantClient(host="qdrant", port=6333)
model = SentenceTransformer('all-MiniLM-L6-v2')

COLLECTION_NAME = "dashboard_pages"

def initialize_qdrant():
    """Initialize Qdrant collection and populate with page data"""
    try:
        # Wait for Qdrant to be ready
        max_retries = 5
        for i in range(max_retries):
            try:
                client.get_collections()
                print("Qdrant is ready")
                break
            except Exception as e:
                print(f"Waiting for Qdrant to be ready... (attempt {i+1}/{max_retries})")
                time.sleep(2)
                if i == max_retries - 1:
                    raise e
        
        # First, try to delete the collection if it exists to start fresh
        try:
            client.delete_collection(collection_name=COLLECTION_NAME)
            print(f"Deleted existing collection: {COLLECTION_NAME}")
            time.sleep(1)  # Wait a bit after deletion
        except Exception:
            print(f"Collection {COLLECTION_NAME} didn't exist or couldn't be deleted")
        
        # Create fresh collection
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )
        print(f"Created Qdrant collection: {COLLECTION_NAME}")
        
        # Add page information using simple integers
        pages_data = [
            {
                "id": 1,  # Use simple integer
                "text": "users page user management view all users create new user user details user list",
                "metadata": {
                    "page_name": "users",
                    "route": "/users",
                    "description": "Manage users, view user list, create new users",
                    "api_endpoints": {
                        "get": "/api/users",
                        "post": "/api/users"
                    }
                }
            },
            {
                "id": 2,  # Use simple integer
                "text": "roles page role management permissions create role view roles role details",
                "metadata": {
                    "page_name": "roles",
                    "route": "/roles",
                    "description": "Manage roles and permissions, create new roles",
                    "api_endpoints": {
                        "get": "/api/roles",
                        "post": "/api/roles"
                    }
                }
            }
        ]
        
        # Insert points one by one for better error handling
        for page in pages_data:
            try:
                embedding = model.encode(page["text"]).tolist()
                point = PointStruct(
                    id=page["id"],
                    vector=embedding,
                    payload=page["metadata"]
                )
                
                client.upsert(
                    collection_name=COLLECTION_NAME,
                    points=[point]
                )
                print(f"Successfully added point for {page['metadata']['page_name']}")
                
            except Exception as e:
                print(f"Error adding point for {page['metadata']['page_name']}: {e}")
        
        print(f"Qdrant initialization completed")
        
    except Exception as e:
        print(f"Error initializing Qdrant: {e}")
        print("Qdrant initialization failed, but the application will continue with limited search capabilities")

def search_qdrant(query: str, limit: int = 5) -> str:
    """Search for relevant pages based on query"""
    try:
        # Check if collection exists
        collections = client.get_collections().collections
        if not any(col.name == COLLECTION_NAME for col in collections):
            print(f"Collection {COLLECTION_NAME} does not exist, using fallback")
            return get_fallback_context()
        
        # Generate embedding for query
        query_embedding = model.encode(query).tolist()
        
        # Search in Qdrant
        search_results = client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_embedding,
            limit=limit
        )
        
        # Format results
        if not search_results:
            return get_fallback_context()
            
        context = "Available pages and routes:\n"
        for result in search_results:
            payload = result.payload
            context += f"- {payload['page_name']}: {payload['route']} - {payload['description']}\n"
            context += f"  APIs: GET {payload['api_endpoints']['get']}, POST {payload['api_endpoints']['post']}\n"
        
        return context
        
    except Exception as e:
        print(f"Error searching Qdrant: {e}")
        return get_fallback_context()

def get_fallback_context() -> str:
    """Fallback context when Qdrant is not available"""
    return """Available pages and routes:
- users: /users - Manage users, view user list, create new users
  APIs: GET /api/users, POST /api/users
- roles: /roles - Manage roles and permissions, create new roles  
  APIs: GET /api/roles, POST /api/roles"""