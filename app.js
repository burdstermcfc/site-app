import React, { useState, useEffect } from 'react';
import { Mail, Briefcase, User, MapPin, Hash, Plus, ArrowLeft, MoreVertical, Paperclip, CheckCircle, Clock, AlertTriangle, ChevronDown, Download, Send, X, Edit, Loader2, Info } from 'lucide-react';

// IMPORTANT: You MUST update this URL to your actual Render backend URL.
const API_BASE_URL = 'https://site-app-xa72.onrender.com';

// Helper to manage API calls
const api = {
    get: async (path, token) => {
        const res = await fetch(`${API_BASE_URL}${path}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const errorBody = await res.json().catch(() => ({ error: 'An unknown error occurred' }));
            throw new Error(errorBody.error || `Request failed with status ${res.status}`);
        }
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
        if (!res.ok) {
            const errorBody = await res.json().catch(() => ({ error: 'An unknown error occurred' }));
            throw new Error(errorBody.error || `Request failed with status ${res.status}`);
        }
        return res.json();
    },
    // You can add put, delete methods here as well
};


// Main App Component
export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [currentPage, setCurrentPage] = useState('login');
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
    const { token, user } = await api.post('/api/login', credentials);
    setToken(token);
    setUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setCurrentPage('projects');
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
        return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
    }

    if (!user) {
        return <AuthPage onLogin={handleLogin} />;
    }

    switch (currentPage) {
      case 'projects':
        return <ProjectsPage user={user} token={token} onSelectProject={(p) => { setSelectedProject(p); setCurrentPage('projectDetails'); }} onLogout={handleLogout} />;
      case 'projectDetails':
        return <ProjectDetailsPage user={user} token={token} project={selectedProject} onBack={() => { setSelectedProject(null); setCurrentPage('projects'); }} />;
      default:
        return <AuthPage onLogin={handleLogin} />;
    }
  };

  return <div className="bg-gray-50 min-h-screen font-sans">{renderPage()}</div>;
}

// Reusable UI Components (same as before)
const Card = ({ children, className = '' }) => <div className={`bg-white rounded-xl shadow-md overflow-hidden ${className}`}>{children}</div>;
const Button = ({ children, onClick, className = '', variant = 'primary', type = 'button', disabled = false }) => { /* ... implementation from previous steps ... */ };
// ... Other components like Input, Textarea, Select, Modal, StatusBadge, Notification ...


// --- PAGE & FORM COMPONENTS ---

function AuthPage({ onLogin }) {
    const [isLoginView, setIsLoginView] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            if (isLoginView) {
                await onLogin({ email, password });
            } else {
                await api.post('/api/register', { name, email, password });
                // Automatically log in after successful registration
                await onLogin({ email, password });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-sm m-4">
            <div className="p-8">
              <div className="text-center mb-6">
                <Briefcase className="mx-auto h-12 w-auto text-blue-600" />
                <h2 className="mt-4 text-3xl font-bold text-gray-900">{isLoginView ? 'Sign In' : 'Create Account'}</h2>
                <p className="mt-2 text-sm text-gray-600">{isLoginView ? 'to access your projects' : 'to get started'}</p>
              </div>
              {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLoginView && (
                    <input name="name" type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-2 border rounded-lg" />
                )}
                <input name="email" type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-2 border rounded-lg" />
                <input name="password" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-2 border rounded-lg" />
                <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300 flex justify-center items-center">
                    {isLoading ? <Loader2 className="animate-spin"/> : (isLoginView ? 'Sign In' : 'Register')}
                </button>
              </form>
              <p className="text-center text-sm mt-6">
                {isLoginView ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => setIsLoginView(!isLoginView)} className="font-semibold text-blue-600 hover:underline">
                  {isLoginView ? 'Register' : 'Sign In'}
                </button>
              </p>
            </div>
          </Card>
        </div>
    );
}


function ProjectsPage({ user, token, onSelectProject, onLogout }) {
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            setIsLoading(true);
            try {
                const data = await api.get('/api/projects', token);
                setProjects(data);
            } catch (error) {
                console.error("Failed to fetch projects", error);
                if (error.message.includes('403') || error.message.includes('401')) {
                    onLogout(); // Token is invalid, log out
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchProjects();
    }, [token, onLogout]);
    
    // ... Rest of the component including UI, create/edit modals etc.
    // This is a simplified display for clarity
    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
                    <p className="text-gray-600">Welcome back, {user?.name}!</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Remember to add the 'Create Project' button and its modal logic here */}
                    <button onClick={onLogout} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold">Logout</button>
                </div>
            </header>
            <div className="space-y-4">
                {projects.length === 0 && !isLoading && (
                    <div className="text-center py-10 bg-white rounded-lg shadow-md">
                        <p className="text-gray-600">You don't have any projects yet.</p>
                        <p className="text-sm text-gray-500 mt-2">Click "Create Project" to get started.</p>
                    </div>
                )}
                {projects.map(project => (
                    <div key={project.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelectProject(project)}>
                        <div className="p-5">
                             <h3 className="text-xl font-semibold text-blue-700">{project.name}</h3>
                             <p className="text-sm text-gray-500 mt-1">#{project.number}</p>
                        </div>
                    </div>
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
            setIsLoading(true);
            try {
                // The 'image_url' from the database is used as 'image' in the frontend state
                const data = await api.get(`/api/projects/${project.id}/snags`, token);
                const formattedSnags = data.map(s => ({...s, image: s.image_url }));
                setSnags(formattedSnags);
            } catch (error) {
                console.error("Failed to fetch snags", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSnags();
    }, [project.id, token]);
    
    // All the PDF and Email functionality from before would be placed here,
    // using the 'snags' state which now comes from the API.
    
    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6">
             <header className="mb-6 flex justify-between items-center">
                <button onClick={onBack} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold flex items-center"><ArrowLeft size={16} className="mr-2" />Back to Projects</button>
                {/* PDF/Email buttons go here */}
             </header>
             <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-md p-5">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">{project.name}</h2>
                         <p className="text-gray-700"><span className="font-semibold">Number:</span> {project.number}</p>
                         <p className="text-gray-700"><span className="font-semibold">Location:</span> {project.location}</p>
                    </div>
                </div>
                <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold text-gray-900">Snag Reports</h3>
                        {/* Add Snag button goes here */}
                    </div>
                     <div className="space-y-4">
                        {snags.map(snag => (
                            <div key={snag.id} className="bg-white rounded-xl shadow-md p-5">
                                 <h4 className="font-semibold">{snag.title}</h4>
                                 <p className="text-sm text-gray-600 mt-1">{snag.description}</p>
                                 {/* StatusBadge component would go here */}
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
