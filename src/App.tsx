import { useState, useEffect } from 'react';
import { apiService } from './services/api';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import { ProjectList } from './components/ProjectManager/ProjectList';
import { CreateProjectModal } from './components/ProjectManager/CreateProjectModal';
import { ModernLayout } from './layout/ModernLayout';

type AuthState = 'login' | 'register' | 'authenticated' | 'loading';

function App() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [showProjectList, setShowProjectList] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    if (apiService.isAuthenticated()) {
      setAuthState('authenticated');
    } else {
      setAuthState('login');
    }
  }, []);

  const handleAuthSuccess = () => {
    setAuthState('authenticated');
    setShowProjectList(true);
  };

  const handleLogout = () => {
    apiService.logout();
    setAuthState('login');
    setCurrentProjectId(null);
    setShowProjectList(false);
  };

  const handleSelectProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    setShowProjectList(false);
  };

  const handleBackToProjects = () => {
    setCurrentProjectId(null);
    setShowProjectList(true);
  };

  const handleCreateNew = () => {
    setShowCreateModal(true);
  };

  const handleProjectCreated = (projectId: string) => {
    setCurrentProjectId(projectId);
    setShowProjectList(false);
    setShowCreateModal(false);
  };

  if (authState === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (authState === 'login') {
    return (
      <Login
        onSuccess={handleAuthSuccess}
        onSwitchToRegister={() => setAuthState('register')}
      />
    );
  }

  if (authState === 'register') {
    return (
      <Register
        onSuccess={handleAuthSuccess}
        onSwitchToLogin={() => setAuthState('login')}
      />
    );
  }

  if (showProjectList || !currentProjectId) {
    return (
      <>
        <div className="flex h-screen bg-slate-900">
          <div className="w-80 border-r border-outline bg-surface-raised p-6">
            <div className="mb-4">
              <h1 className="text-xl font-bold text-slate-100">KABS Design Tool</h1>
            </div>
            <ProjectList
              onSelectProject={handleSelectProject}
              onCreateNew={handleCreateNew}
              onRefresh={() => {}}
              onLogout={handleLogout}
            />
          </div>
          <div className="flex-1">
            <div className="flex h-full items-center justify-center text-slate-400">
              <div className="text-center">
                <p className="mb-4">No project selected</p>
                <p className="text-sm">Select a project from the list or create a new one</p>
              </div>
            </div>
          </div>
        </div>
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleProjectCreated}
        />
      </>
    );
  }

  return (
    <ModernLayout 
      projectId={currentProjectId} 
      onBackToProjects={handleBackToProjects}
      onLogout={handleLogout}
    />
  );
}

export default App;
