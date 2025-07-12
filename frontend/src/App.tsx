import { Link, Route, BrowserRouter as Router, Routes, useNavigate } from "react-router-dom";
import Chat from "./Chat";
import './Dashboard.css';
import Roles from "./Roles";
import Users from "./Users";
import VoiceAssistant from "./VoiceAssistant";

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const navigate = useNavigate();

  const handleVoiceNavigation = (route: string) => {
    navigate(route);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      {/* Navigation Header */}
      <nav style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '15px 30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h1 style={{ color: 'white', margin: 0, fontSize: '1.5em' }}>
            🚀 AI Dashboard
          </h1>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link 
              to="/" 
              style={{ 
                color: 'white', 
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.backgroundColor = 'transparent'}
            >
              Home
            </Link>
            <Link 
              to="/users" 
              style={{ 
                color: 'white', 
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.backgroundColor = 'transparent'}
            >
              Users
            </Link>
            <Link 
              to="/roles" 
              style={{ 
                color: 'white', 
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.backgroundColor = 'transparent'}
            >
              Roles
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ padding: '30px 0', minHeight: 'calc(100vh - 80px)' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/users" element={<Users />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/vendor-form" element={<div>Vendor Form (Sample Page)</div>} />
        </Routes>
      </main>

      {/* AI Chat Assistant */}
      <Chat />

      {/* Voice Assistant */}
      <VoiceAssistant onNavigate={handleVoiceNavigation} />
    </div>
  );
}

// Home Page Component
function HomePage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '50px'
      }}>
        <h1 style={{ fontSize: '3em', color: '#333', marginBottom: '10px' }}>
          Welcome to AI Dashboard 🎯
        </h1>
        <p style={{ fontSize: '1.2em', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
          Your intelligent dashboard assistant powered by AI. Navigate, create, and manage your resources using natural language.
        </p>
        
        {/* Voice Assistant Info */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '15px',
          margin: '30px auto',
          maxWidth: '500px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.3em' }}>🎤 Voice Assistant "Horizon"</h3>
          <p style={{ margin: '0', fontSize: '1em', opacity: 0.9 }}>
            Click the robot button to start wake word detection, then say <strong>"Hello Horizon"</strong> to activate voice control!
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '30px',
        marginTop: '50px'
      }}>
        {/* Feature Cards */}
        <FeatureCard 
          icon="👥"
          title="User Management"
          description="Manage users, view user lists, and create new user accounts with ease."
          link="/users"
        />
        <FeatureCard 
          icon="🔐"
          title="Role & Permissions"
          description="Define roles, assign permissions, and control access to your application."
          link="/roles"
        />
        <FeatureCard 
          icon="🤖"
          title="AI Chat Assistant"
          description="Use natural language to navigate and perform actions via text chat."
          link="#"
        />
        <FeatureCard 
          icon="🎤"
          title="Voice Assistant"
          description='Start wake word detection, then say "Hello Horizon" to activate hands-free control!'
          link="#"
        />
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        marginTop: '50px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ color: '#333', marginBottom: '20px' }}>Try these AI commands:</h3>
        <div style={{ display: 'grid', gap: '15px' }}>
          <CommandExample command="show me users" description="Navigate to the users page" />
          <CommandExample command="create user with name John and phone 123456789" description="Create a new user" />
          <CommandExample command="go to roles page" description="Navigate to roles management" />
          <CommandExample command="create role named Admin with permissions read, write, delete" description="Create a new role" />
        </div>
      </div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description, link }: {
  icon: string;
  title: string;
  description: string;
  link: string;
}) {
  return (
    <div style={{
      background: 'white',
      padding: '30px',
      borderRadius: '12px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      textAlign: 'center'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-5px)';
      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
    }}>
      <div style={{ fontSize: '3em', marginBottom: '15px' }}>{icon}</div>
      <h3 style={{ color: '#333', marginBottom: '15px' }}>{title}</h3>
      <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '20px' }}>{description}</p>
      {link !== '#' && (
        <Link to={link} style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textDecoration: 'none',
          padding: '10px 20px',
          borderRadius: '8px',
          display: 'inline-block',
          fontWeight: '600'
        }}>
          Explore
        </Link>
      )}
    </div>
  );
}

// Command Example Component
function CommandExample({ command, description }: {
  command: string;
  description: string;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '15px',
      background: '#f8f9fa',
      borderRadius: '8px',
      borderLeft: '4px solid #667eea'
    }}>
      <code style={{
        background: '#e9ecef',
        padding: '4px 8px',
        borderRadius: '4px',
        fontFamily: 'monospace',
        marginRight: '15px',
        minWidth: '200px'
      }}>
        "{command}"
      </code>
      <span style={{ color: '#666' }}>{description}</span>
    </div>
  );
}

export default App;