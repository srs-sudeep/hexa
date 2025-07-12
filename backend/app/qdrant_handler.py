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
            time.sleep(1)
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
                "id": 1,
                "name": "users",
                "route": "/users",  # Frontend route
                "description": "Manage users, view user list, create new users",
                "api_endpoints": "GET /api/users (list), POST /api/users (create)"
            },
            {
                "id": 2, 
                "name": "roles",
                "route": "/roles",  # Frontend route
                "description": "Manage roles and permissions, create new roles",
                "api_endpoints": "GET /api/roles (list), POST /api/roles (create)"
            }
        ]

        for page in pages_data:
            # Create text for embedding
            text = f"{page['name']} page: {page['description']} - Frontend route: {page['route']} - API endpoints: {page['api_endpoints']}"
            
            # Generate embedding
            embedding = model.encode(text).tolist()
            
            # Create point
            point = PointStruct(
                id=page["id"],
                vector=embedding,
                payload=page
            )
            
            # Add to collection
            try:
                client.upsert(
                    collection_name=COLLECTION_NAME,
                    points=[point]
                )
                print(f"Successfully added point for {page['name']}")
            except Exception as e:
                print(f"Error adding point for {page['name']}: {e}")
        
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
        
        if not search_results:
            return get_fallback_context()
        
        # Format results for LLM context
        context_parts = []
        for result in search_results:
            payload = result.payload
            context_parts.append(
                f"- {payload['name']}: Frontend route {payload['route']} - {payload['description']}\n  API endpoints: {payload['api_endpoints']}"
            )
        
        return "\n".join(context_parts)
        
    except Exception as e:
        print(f"Error searching Qdrant: {e}")
        return get_fallback_context()

def get_fallback_context() -> str:
    """Fallback context when Qdrant is not available"""
    return """- users: Frontend route /users - Manage users, view user list, create new users
  API endpoints: GET /api/users (list), POST /api/users (create)
- roles: Frontend route /roles - Manage roles and permissions, create new roles
  API endpoints: GET /api/roles (list), POST /api/roles (create)"""