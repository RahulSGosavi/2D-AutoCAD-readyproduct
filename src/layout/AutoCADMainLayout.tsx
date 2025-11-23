// src/layout/AutoCADMainLayout.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AutoCADTopBar } from './AutoCADTopBar';
import { AutoCADSidebar } from './AutoCADSidebar';
import { AutoCADStatusBar } from './AutoCADStatusBar';
import { AdvancedCanvas } from '../canvas/AdvancedCanvas';
import { AutoCADLayersPanel } from '../components/AutoCADLayersPanel';
import { AutoCADBlocksPanel } from '../components/AutoCADBlocksPanel';
import { AutoCADColorPalette } from '../components/AutoCADColorPalette';
import { PDFPageChanger } from '../components/PDFPageChanger';
import { useEditorStore } from '../state/useEditorStore';
import { apiService } from '../services/api';

interface AutoCADMainLayoutProps {
  projectId?: string | null;
  onBackToProjects?: () => void;
  onLogout?: () => void;
}

export const AutoCADMainLayout: React.FC<AutoCADMainLayoutProps> = ({ 
  projectId, 
  onBackToProjects,
  onLogout 
}) => {
  const [rightPanelTab, setRightPanelTab] = useState<'layers' | 'blocks' | 'colors'>('layers');
  const [autosaveStatus, setAutosaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const { loadFromLocalStorage, saveToLocalStorage, elements, layers, pdfBackground } = useEditorStore();
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(0);
  const AUTOSAVE_INTERVAL = 30000; // 30 seconds
  const AUTOSAVE_DEBOUNCE = 2000; // 2 seconds after last change

  // Load project data on mount or when projectId changes
  useEffect(() => {
    if (projectId) {
      // Load from API
      loadProjectData(projectId);
    } else {
      // Fallback to localStorage for backward compatibility
      loadFromLocalStorage();
    }
  }, [projectId, loadFromLocalStorage]);

  const loadProjectData = async (id: string) => {
    try {
      const response = await apiService.getProject(id);
      if (response.data?.project?.data) {
        const projectData = response.data.project.data;
        console.log('Loading project data:', {
          layers: projectData.layers?.length || 0,
          elements: projectData.elements?.length || 0,
          activeLayerId: projectData.activeLayerId,
        });
        
        // Load project data into store
        const { loadFromProjectData } = useEditorStore.getState();
        loadFromProjectData({
          layers: projectData.layers || [],
          elements: projectData.elements || [],
          activeLayerId: projectData.activeLayerId || '',
          snapSettings: projectData.snapSettings,
        });
      } else {
        console.warn('Project data is empty, using default state');
        // If no data, ensure we have at least one layer
        const { loadFromProjectData } = useEditorStore.getState();
        loadFromProjectData({
          layers: [],
          elements: [],
          activeLayerId: '',
        });
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      loadFromLocalStorage(); // Fallback
    }
  };

  // Autosave function (debounced)
  const autosave = useCallback(() => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    
    setAutosaveStatus('unsaved');
    
    autosaveTimeoutRef.current = setTimeout(async () => {
      setAutosaveStatus('saving');
      if (projectId) {
        // Save to API
        try {
          const state = useEditorStore.getState();
          const projectData = {
            layers: state.layers,
            elements: state.elements,
            activeLayerId: state.activeLayerId,
            snapSettings: state.snapSettings,
            drawingSettings: state.drawingSettings,
            pdfBackground: state.pdfBackground,
          };
          await apiService.saveProjectData(projectId, projectData);
        } catch (error) {
          console.error('Failed to save to API:', error);
          saveToLocalStorage(); // Fallback
        }
      } else {
        saveToLocalStorage();
      }
      lastSaveRef.current = Date.now();
      setAutosaveStatus('saved');
      console.log('Autosaved at', new Date().toLocaleTimeString());
    }, AUTOSAVE_DEBOUNCE);
  }, [saveToLocalStorage]);

  // Autosave on changes
  useEffect(() => {
    autosave();
  }, [elements, layers, pdfBackground, autosave]);

  // Periodic autosave (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceLastSave = Date.now() - lastSaveRef.current;
      if (timeSinceLastSave >= AUTOSAVE_INTERVAL) {
        setAutosaveStatus('saving');
        saveToLocalStorage();
        lastSaveRef.current = Date.now();
        setAutosaveStatus('saved');
        console.log('Periodic autosave at', new Date().toLocaleTimeString());
      }
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [saveToLocalStorage]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      saveToLocalStorage();
      // Optional: Show warning if there are unsaved changes
      // e.preventDefault();
      // e.returnValue = '';
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Save when tab becomes hidden
        saveToLocalStorage();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [saveToLocalStorage]);

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Top Bar */}
      <AutoCADTopBar onBackToProjects={onBackToProjects} />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <AutoCADSidebar />

        {/* Canvas Area */}
        <div className="flex-1 relative">
          <AdvancedCanvas />
          <PDFPageChanger />
        </div>

        {/* Right Sidebar */}
        <div className="w-64 bg-slate-800 border-l border-slate-700 flex flex-col">
            {/* Tab Buttons */}
            <div className="flex border-b border-slate-700">
              <button
                onClick={() => setRightPanelTab('layers')}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                  rightPanelTab === 'layers'
                    ? 'bg-slate-700 text-white border-b-2 border-b-blue-500'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Layers
              </button>
              <button
                onClick={() => setRightPanelTab('blocks')}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                  rightPanelTab === 'blocks'
                    ? 'bg-slate-700 text-white border-b-2 border-b-blue-500'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Blocks
              </button>
              <button
                onClick={() => setRightPanelTab('colors')}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                  rightPanelTab === 'colors'
                    ? 'bg-slate-700 text-white border-b-2 border-b-blue-500'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Colors
              </button>
            </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden">
            {rightPanelTab === 'layers' && <AutoCADLayersPanel />}
            {rightPanelTab === 'blocks' && <AutoCADBlocksPanel />}
            {rightPanelTab === 'colors' && <AutoCADColorPalette />}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <AutoCADStatusBar autosaveStatus={autosaveStatus} />
    </div>
  );
};

