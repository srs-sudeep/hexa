import requests
import json
import re

OLLAMA_URL = "http://ollama:11434/api/generate"

def query_ollama(context: str, query: str) -> dict:
    prompt = f"""You are a smart dashboard assistant. Based on the user query and available context, determine the appropriate action.

Available pages and their routes:
{context}

User query: {query}

Analyze the query and respond with a JSON object containing:
1. action_type: "navigate" (go to page), "create" (create resource), "show" (display data), or "general" (other)
2. target_page: name of the page if applicable
3. route: route to navigate to if applicable  
4. api_call: object with method, endpoint, and data if API call needed
5. message: helpful response to user

Examples:
- "show me users" -> {{"action_type": "navigate", "target_page": "users", "route": "/users", "message": "Navigating to users page"}}
- "create user name John phone 123456" -> {{"action_type": "create", "target_page": "users", "api_call": {{"method": "POST", "endpoint": "/api/users", "data": {{"name": "John", "phone_number": "123456"}}}}, "message": "Creating new user John"}}

Respond only with valid JSON:"""

    payload = {
        "model": "llama3.2:1b",
        "prompt": prompt,
        "stream": False
    }
    print("Testing auto-reload functionality")
    print(payload)
    
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
        response.raise_for_status()  # Raise an exception for bad status codes
        
        response_data = response.json()
        print(response_data)
        # Check if response has the expected structure
        if "response" not in response_data:
            print(f"Unexpected Ollama response structure: {response_data}")
            return get_fallback_response(query)
            
        response_text = response_data["response"]
        
        # Extract JSON from response
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
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

def get_fallback_response(query: str) -> dict:
    """Generate a simple fallback response when LLM is not available"""
    query_lower = query.lower()
    
    # Simple keyword matching for basic functionality
    if any(word in query_lower for word in ["user", "users"]):
        if any(word in query_lower for word in ["show", "view", "see", "list"]):
            return {
                "action_type": "navigate",
                "target_page": "users",
                "route": "/users",
                "message": "Navigating to users page"
            }
        elif any(word in query_lower for word in ["create", "add", "new"]):
            # Try to extract name and phone from query
            name_match = re.search(r'name\s+(\w+)', query_lower)
            phone_match = re.search(r'phone\s+(\d+)', query_lower)
            
            if name_match:
                data = {"name": name_match.group(1)}
                if phone_match:
                    data["phone_number"] = phone_match.group(1)
                
                return {
                    "action_type": "create",
                    "target_page": "users",
                    "api_call": {
                        "method": "POST",
                        "endpoint": "/api/users",
                        "data": data
                    },
                    "message": f"Creating new user {name_match.group(1)}"
                }
    
    elif any(word in query_lower for word in ["role", "roles"]):
        if any(word in query_lower for word in ["show", "view", "see", "list"]):
            return {
                "action_type": "navigate",
                "target_page": "roles",
                "route": "/roles",
                "message": "Navigating to roles page"
            }
    
    # Default response
    return {
        "action_type": "general",
        "message": "I can help you navigate to users or roles pages, or create new users. Try saying 'show me users' or 'create user with name John and phone 123456'."
    }