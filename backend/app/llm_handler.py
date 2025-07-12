import requests
import json
import re

OLLAMA_URL = "http://ollama:11434/api/generate"

def query_ollama(context: str, query: str) -> dict:
    prompt = f"""You are a smart dashboard assistant. Based on the user query and available context, determine the appropriate action.

Available pages:
{context}

User query: {query}

STRICT RULES:
1. For navigation: use action_type "navigate" with route like "/users" or "/roles" (NO /api/)
2. For creating: use action_type "create" with api_call object containing method, endpoint, and data
3. ALWAYS include api_call for create actions
4. Extract exact names and phone numbers from user input

Examples:
- "show me users" -> {{"action_type": "navigate", "target_page": "users", "route": "/users", "message": "Navigating to users page"}}
- "create user with name John and phone 123456" -> {{"action_type": "create", "target_page": "users", "route": "/users", "api_call": {{"method": "POST", "endpoint": "/api/users", "data": {{"name": "John", "phone_number": "123456"}}}}, "message": "Creating new user John"}}

Respond ONLY with valid JSON:"""

    payload = {
        "model": "qwen2:0.5b",
        "prompt": prompt,
        "stream": False
    }
    print(query)
    print(context)
    
    try:
        # Check if Ollama is accessible
        health_response = requests.get("http://ollama:11434/", timeout=5)
        if health_response.status_code != 200:
            return get_fallback_response(query)
    except requests.RequestException:
        print("Ollama service is not accessible, using fallback response")
        return get_fallback_response(query)
    
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=30)
        response.raise_for_status()
        
        response_data = response.json()
        print(response_data)
        
        if "response" not in response_data:
            print(f"Unexpected Ollama response structure: {response_data}")
            return get_fallback_response(query)
            
        response_text = response_data["response"]
        
        # Extract JSON from response
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            try:
                llm_result = json.loads(json_match.group())
                
                # Validate and fix common LLM mistakes
                llm_result = fix_llm_response(llm_result, query)
                return llm_result
                
            except json.JSONDecodeError as e:
                print(f"Failed to parse JSON from LLM response: {e}")
                print(f"Raw response: {response_text}")
        
        # Fallback response
        return get_fallback_response(query)
    except requests.RequestException as e:
        print(f"Request error when calling Ollama: {e}")
        return get_fallback_response(query)
    except Exception as e:
        print(f"Unexpected error in LLM handler: {e}")
        return get_fallback_response(query)

def fix_llm_response(llm_result: dict, query: str) -> dict:
    """Fix common LLM mistakes in the response"""
    
    # If it's a create action but missing api_call, add it
    if llm_result.get("action_type") == "create" and "api_call" not in llm_result:
        query_lower = query.lower()
        
        if "user" in query_lower:
            # Extract name and phone from query
            name_match = re.search(r'name\s+([^and]+?)(?:\s+and|\s+phone|\s*$)', query, re.IGNORECASE)
            phone_match = re.search(r'phone\s+(\d+)', query, re.IGNORECASE)
            
            data = {}
            if name_match:
                data["name"] = name_match.group(1).strip()
            if phone_match:
                data["phone_number"] = phone_match.group(1)
            
            llm_result["api_call"] = {
                "method": "POST",
                "endpoint": "/api/users",
                "data": data
            }
            llm_result["target_page"] = "users"
            llm_result["route"] = "/users"
            
            if name_match:
                llm_result["message"] = f"Creating new user {data['name']}"
        
        elif "role" in query_lower:
            # Extract role name
            name_match = re.search(r'name\s+([^and]+?)(?:\s+and|\s+with|\s*$)', query, re.IGNORECASE)
            
            data = {}
            if name_match:
                data["name"] = name_match.group(1).strip()
            
            llm_result["api_call"] = {
                "method": "POST",
                "endpoint": "/api/roles",
                "data": data
            }
            llm_result["target_page"] = "roles"
            llm_result["route"] = "/roles"
            
            if name_match:
                llm_result["message"] = f"Creating new role {data['name']}"
    
    # Fix wrong routes for navigation
    if llm_result.get("action_type") == "navigate":
        if llm_result.get("target_page") == "users":
            llm_result["route"] = "/users"
        elif llm_result.get("target_page") == "roles":
            llm_result["route"] = "/roles"
    
    return llm_result

def get_fallback_response(query: str) -> dict:
    """Generate a simple fallback response when LLM is not available"""
    query_lower = query.lower()
    
    # Simple keyword matching for basic functionality
    if any(word in query_lower for word in ["user", "users"]):
        if any(word in query_lower for word in ["show", "view", "see", "list", "go"]):
            return {
                "action_type": "navigate",
                "target_page": "users",
                "route": "/users",
                "message": "Navigating to users page"
            }
        elif any(word in query_lower for word in ["create", "add", "new"]):
            # Try to extract name and phone from query
            name_match = re.search(r'name\s+([^and]+?)(?:\s+and|\s+phone|\s*$)', query, re.IGNORECASE)
            phone_match = re.search(r'phone\s+(\d+)', query, re.IGNORECASE)
            
            data = {}
            message = "Creating new user"
            
            if name_match:
                data["name"] = name_match.group(1).strip()
                message = f"Creating new user {data['name']}"
            if phone_match:
                data["phone_number"] = phone_match.group(1)
                
            return {
                "action_type": "create",
                "target_page": "users",
                "route": "/users",
                "api_call": {
                    "method": "POST",
                    "endpoint": "/api/users",
                    "data": data
                },
                "message": message
            }
    
    elif any(word in query_lower for word in ["role", "roles"]):
        if any(word in query_lower for word in ["show", "view", "see", "list", "go"]):
            return {
                "action_type": "navigate",
                "target_page": "roles",
                "route": "/roles",
                "message": "Navigating to roles page"
            }
        elif any(word in query_lower for word in ["create", "add", "new"]):
            # Try to extract role name
            name_match = re.search(r'name\s+([^and]+?)(?:\s+and|\s+with|\s*$)', query, re.IGNORECASE)
            
            data = {}
            message = "Creating new role"
            
            if name_match:
                data["name"] = name_match.group(1).strip()
                message = f"Creating new role {data['name']}"
                
            return {
                "action_type": "create",
                "target_page": "roles",
                "route": "/roles",
                "api_call": {
                    "method": "POST",
                    "endpoint": "/api/roles",
                    "data": data
                },
                "message": message
            }
    
    # Default response
    return {
        "action_type": "general",
        "message": "I can help you navigate to users or roles pages, or create new users. Try saying 'show me users' or 'create user with name John and phone 123456'."
    }