import React, { useState, useEffect } from 'react';
import { Mail, Briefcase, User, MapPin, Hash, Plus, ArrowLeft, MoreVertical, Paperclip, CheckCircle, Clock, AlertTriangle, ChevronDown, Download, Send, X, Edit, Loader2, Info } from 'lucide-react';

const API_BASE_URL = 'postgresql://site_app_postgresql_user:JvW8L9ch55nSB4NVxAkTOIR0UDT71wC8@dpg-d1e5l56r433s73cc7nig-a.frankfurt-postgres.render.com/site_app_postgresql'; // <-- IMPORTANT: CHANGE THIS

// Helper to manage API calls
const api = {
    get: async (path, token) => {
        const res = await fetch(`${API_BASE_URL}${path}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },
    post: async (path, body, token) => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE_URL}${path}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },
    // You would add put, delete methods here as well
};


// Main App Component
export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token')); // Load token from storage
  const [currentPage, setCurrentPage] = useState('login');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Effect to validate token on app load
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setCurrentPage('projects');
    }
    setIsLoading(false);
  }, []);

  const handleLogin = async (credentials) => {
      try {
          const { token, user } = await api.post('/api/login', credentials);
          setToken(token);
          setUser(user);
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          setCurrentPage('projects');
      } catch (error) {
          console.error("Login failed:", error);
          // Here you would show an error message to the user
      }
  };
  
  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentPage('login');
  };
  
  const renderPage = () => {
    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin" size={48} /></div>
    }
    switch (currentPage) {
      case 'login':
        return <LoginPage onLogin={handleLogin} />;
      case 'projects':
        return user ? <ProjectsPage user={user} token={token} onSelectProject={(p) => { setSelectedProject(p); setCurrentPage('projectDetails'); }} onLogout={handleLogout} /> : <LoginPage onLogin={handleLogin} />;
      case 'projectDetails':
        return selectedProject ? <ProjectDetailsPage user={user} token={token} project={selectedProject} onBack={() => setCurrentPage('projects')} /> : <ProjectsPage user={user} token={token} onSelectProject={(p) => { setSelectedProject(p); setCurrentPage('projectDetails'); }} onLogout={handleLogout} />;
      default:
        return <LoginPage onLogin={handleLogin} />;
    }
  };

  return <div className="bg-gray-50 min-h-screen font-sans">{renderPage()}</div>;
}


// Page Components (Updated to use API calls)

function ProjectsPage({ user, token, onSelectProject, onLogout }) {
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await api.get('/api/projects', token);
                setProjects(data);
            } catch (error) {
                console.error("Failed to fetch projects", error);
                // Handle error, e.g., redirect to login if unauthorized
            } finally {
                setIsLoading(false);
            }
        };
        fetchProjects();
    }, [token]);

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin" size={48} /></div>
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
                    <p className="text-gray-600">Welcome back, {user?.name}!</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Add Create Project Button and Modal Here */}
                    <Button onClick={onLogout} variant="secondary">Logout</Button>
                </div>
            </header>
            <div className="space-y-4">
                {projects.map(project => (
                    <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelectProject(project)}>
                        <div className="p-5">
                             <h3 className="text-xl font-semibold text-blue-700">{project.name}</h3>
                             <p className="text-sm text-gray-500 mt-1">#{project.number}</p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function ProjectDetailsPage({ user, token, project, onBack }) {
    const [snags, setSnags] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const fetchSnags = async () => {
            try {
                const data = await api.get(`/api/projects/${project.id}/snags`, token);
                setSnags(data);
            } catch (error) {
                console.error("Failed to fetch snags", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSnags();
    }, [project.id, token]);
    
    // PDF and other functionality remains the same, but would use the `snags` state
    
    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin" size={48} /></div>
    }

    // This is a simplified view. The full details, buttons, modals, and PDF generation
    // logic from the previous version would be integrated here.
    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6">
             <header className="mb-6">
                <Button onClick={onBack} variant="secondary"><ArrowLeft size={16} className="mr-2" />Back to Projects</Button>
            </header>
             <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Card>
                        <div className="p-5">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">{project.name}</h2>
                             <p>Number: {project.number}</p>
                             <p>Location: {project.location}</p>
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Snag Reports</h3>
                     <div className="space-y-4">
                        {snags.map(snag => (
                            <Card key={snag.id}>
                               <div className="p-5">
                                    <h4 className="font-semibold">{snag.title}</h4>
                                    <p>{snag.description}</p>
                                    <StatusBadge status={snag.status} />
                               </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

// NOTE: The LoginPage, forms, modals, and other components would also need to be updated
// to use API calls instead of manipulating local state directly. This example focuses on
// the core architectural change of fetching data from the new backend.
// Other components like LoginPage, StatusBadge, Card, Button, etc., remain the same as before.
