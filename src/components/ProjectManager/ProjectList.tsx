import { useEffect, useState } from 'react';
import { apiService } from '../../services/api';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  version_count: number;
}

interface ProjectListProps {
  onSelectProject: (projectId: string) => void;
  onCreateNew: () => void;
  onRefresh: () => void;
  onLogout?: () => void;
}

export const ProjectList = ({ onSelectProject, onCreateNew, onRefresh, onLogout }: ProjectListProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.getProjects();
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setProjects(response.data.projects);
      }
    } catch (err) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const projectName = projects.find(p => p.id === projectId)?.name || 'this project';
    if (!confirm(`Are you sure you want to delete "${projectName}"?\n\nThis action cannot be undone.`)) return;

    try {
      const response = await apiService.deleteProject(projectId);
      if (response.error) {
        alert(response.error);
      } else {
        loadProjects();
        onRefresh();
      }
    } catch (err) {
      alert('Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-slate-400">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between border-b border-outline pb-4">
        <h2 className="text-lg font-semibold text-slate-100">Projects</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onCreateNew}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent/90"
          >
            + New Project
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 border border-outline transition hover:bg-surface-sunken hover:text-slate-100"
              title="Logout"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/20 border border-red-500/50 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto">
        {projects.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-400">
            <div className="text-center">
              <p className="mb-2">No projects yet</p>
              <button
                onClick={onCreateNew}
                className="text-accent hover:underline"
              >
                Create your first project
              </button>
            </div>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="cursor-pointer rounded-lg border border-outline bg-surface-sunken p-4 transition hover:border-accent hover:bg-surface-raised"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-100">{project.name}</h3>
                  {project.description && (
                    <p className="mt-1 text-sm text-slate-400">{project.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                    <span>Updated: {new Date(project.updated_at).toLocaleDateString()}</span>
                    <span>Versions: {project.version_count}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(project.id, e)}
                  className="ml-2 rounded px-2 py-1 text-sm text-red-400 border border-red-500/30 transition hover:bg-red-500/20 hover:border-red-500/50"
                  title="Delete project"
                >
                  <svg className="h-4 w-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

