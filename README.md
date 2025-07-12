# AI Dashboard Agent System

An intelligent dashboard system powered by AI that allows you to navigate and manage your application using natural language commands. Built with FastAPI, React, PostgreSQL, Qdrant, and Ollama.

## 🌟 Features

- **Natural Language Interface**: Chat with your dashboard using plain English
- **Smart Navigation**: Ask the AI to navigate to different pages
- **Automated Actions**: Create users, roles, and other resources via chat
- **Vector Search**: Powered by Qdrant for intelligent context understanding
- **Local LLM**: Uses Ollama with Llama3 model for privacy and offline capability

## 🏗️ Architecture

- **Frontend**: React with TypeScript
- **Backend**: FastAPI with Python
- **Database**: PostgreSQL for data storage
- **Vector DB**: Qdrant for semantic search
- **LLM**: Ollama with Llama3 model
- **Orchestration**: Docker Compose

## 🚀 Quick Start

1. **Clone and navigate to the project:**
   ```bash
   cd /home/dhanvatri/Desktop/RaG
   ```

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Setup the AI model (first time only):**
   ```bash
   ./setup.sh
   ```

4. **Access the application:**
   - Frontend: http://localhost:3050
   - Backend API: http://localhost:8050
   - Qdrant Dashboard: http://localhost:6333/dashboard

## 💬 AI Commands

The AI assistant can understand various commands:

### Navigation Commands
- `"show me users"` - Navigate to users page
- `"go to roles page"` - Navigate to roles page
- `"take me to user management"` - Navigate to users page

### Creation Commands
- `"create user with name John and phone 123456789"` - Create a new user
- `"add user named Alice with email alice@example.com and phone 987654321"` - Create user with email
- `"create role named Admin with permissions read, write, delete"` - Create a new role
- `"add role called Manager with description 'Team manager role'"` - Create role with description

### Information Commands
- `"how many users do we have?"` - General information query
- `"what can I do here?"` - Get help and available actions

## 🗂️ Project Structure

```
RaG/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── models.py            # Database models
│   │   ├── schema.py            # Pydantic schemas
│   │   ├── database.py          # Database configuration
│   │   ├── qdrant_handler.py    # Vector search logic
│   │   ├── llm_handler.py       # Ollama integration
│   │   └── seed_data.py         # Database seeding
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Main application
│   │   ├── Chat.tsx             # AI chat interface
│   │   ├── Users.tsx            # User management page
│   │   ├── Roles.tsx            # Role management page
│   │   ├── api.ts               # API configuration
│   │   └── Dashboard.css        # Styling
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml           # Container orchestration
├── setup.sh                     # Setup script
└── README.md                    # This file
```

## 🔧 How It Works

### 1. Vector Search with Qdrant
- Page metadata and API schemas are stored as vectors in Qdrant
- User queries are converted to embeddings for semantic search
- Relevant page information is retrieved as context

### 2. LLM Processing with Ollama
- The AI model (Llama3) receives user query + context
- Returns structured JSON with action type, target page, and API calls
- Supports navigation, creation, and general assistance

### 3. Frontend Intelligence
- Chat component processes AI responses
- Automatically navigates to pages when requested
- Executes API calls for resource creation
- Provides real-time feedback to users

### 4. Database Integration
- PostgreSQL stores users, roles, and page configurations
- Automatic database seeding on startup
- RESTful API endpoints for all operations

## 🛠️ Adding New Pages

To add a new page to the AI system:

1. **Create the React component** in `frontend/src/`
2. **Add the route** in `App.tsx`
3. **Add API endpoints** in `backend/app/main.py`
4. **Update Qdrant data** in `backend/app/qdrant_handler.py`
5. **Restart the application**

Example for adding a "Products" page:

```python
# In qdrant_handler.py
{
    "id": "products_page",
    "text": "products page product management view all products create new product product details product list inventory",
    "metadata": {
        "page_name": "products",
        "route": "/products",
        "description": "Manage products, view product list, create new products",
        "api_endpoints": {
            "get": "/api/products",
            "post": "/api/products"
        }
    }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Ollama model not loaded:**
   ```bash
   docker-compose exec ollama ollama pull llama3
   ```

2. **Database connection issues:**
   ```bash
   docker-compose restart postgres backend
   ```

3. **Qdrant collection errors:**
   ```bash
   docker-compose restart qdrant backend
   ```

4. **Frontend build issues:**
   ```bash
   cd frontend && npm install
   docker-compose rebuild frontend
   ```

### Logs and Debugging

- Backend logs: `docker-compose logs backend`
- Frontend logs: `docker-compose logs frontend`
- Database logs: `docker-compose logs postgres`
- Qdrant logs: `docker-compose logs qdrant`
- Ollama logs: `docker-compose logs ollama`

## 🔮 Future Enhancements

- [ ] Multi-modal support (image understanding)
- [ ] Advanced permissions system
- [ ] Real-time notifications
- [ ] Export/Import functionality
- [ ] Advanced analytics dashboard
- [ ] Mobile responsiveness
- [ ] Multi-language support
- [ ] Voice interface

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to submit issues, feature requests, and pull requests to improve the system!

---

**Happy coding! 🚀**
