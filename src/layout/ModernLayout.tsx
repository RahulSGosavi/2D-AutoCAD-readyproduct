// src/layout/ModernLayout.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AdvancedCanvas } from '../canvas/AdvancedCanvas';
// ElevationCanvas removed - focusing on Floor Plan + Layout only
import { DrawingLayoutCanvas } from '../canvas/DrawingLayoutCanvas';
import { PDFPageChanger } from '../components/PDFPageChanger';
import { useEditorStore } from '../state/useEditorStore';
import { useThemeStore } from '../state/useThemeStore';
import { apiService } from '../services/api';
import { LeftToolbar } from '../components/modern/LeftToolbar';
import { TopBar } from '../components/modern/TopBar';
import { BottomBar } from '../components/modern/BottomBar';
import { ModernBlocksPanel } from '../components/modern/ModernBlocksPanel';
import { ModernLayersPanel } from '../components/modern/ModernLayersPanel';
import { ModernPropertiesPanel } from '../components/modern/ModernPropertiesPanel';
import { CommandPalette } from '../components/modern/CommandPalette';
import { PlacementBox } from '../components/modern/PlacementBox';
import { ItemsListPanel } from '../components/modern/ItemsListPanel';
import { GlobalAttributesPanel } from '../components/modern/GlobalAttributesPanel';

interface ModernLayoutProps {
  projectId?: string | null;
  onBackToProjects?: () => void;
  onLogout?: () => void;
}

export const ModernLayout: React.FC<ModernLayoutProps> = ({
  projectId,
  onBackToProjects,
}) => {
  const [showBlocks, setShowBlocks] = useState(true);
  const [showLayers, setShowLayers] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [showPlacement, setShowPlacement] = useState(false);
  const [showItemsList, setShowItemsList] = useState(false);
  const [showGlobalAttributes, setShowGlobalAttributes] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const { loadFromLocalStorage, saveToLocalStorage, elements, layers, pdfBackground, viewMode, setViewMode, stageInstance, setFloorPlanSnapshot } = useEditorStore();
  const { resolvedTheme } = useThemeStore();
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const AUTOSAVE_DEBOUNCE = 2000;

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  // Command palette shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if (e.key === 'Escape') setShowCommandPalette(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Capture floor plan snapshot when leaving floor plan view
  useEffect(() => {
    if (viewMode !== 'floorPlan' && stageInstance) {
      // We're switching away from floor plan, capture it
      try {
        const dataUrl = stageInstance.toDataURL({ pixelRatio: 2 });
        setFloorPlanSnapshot(dataUrl);
      } catch (e) {
        console.log('Could not capture floor plan snapshot');
      }
    }
  }, [viewMode, stageInstance, setFloorPlanSnapshot]);

  // Auto-save floor plan snapshot every 3 seconds while in floor plan view
  useEffect(() => {
    if (viewMode !== 'floorPlan' || !stageInstance) return;
    
    const autoSaveSnapshot = () => {
      try {
        const dataUrl = stageInstance.toDataURL({ pixelRatio: 2 });
        setFloorPlanSnapshot(dataUrl);
      } catch (e) {
        // Silent fail
      }
    };

    // Initial capture
    autoSaveSnapshot();
    
    // Set up interval for auto-save
    const interval = setInterval(autoSaveSnapshot, 3000);
    
    return () => clearInterval(interval);
  }, [viewMode, stageInstance, setFloorPlanSnapshot]);

  // Load project
  useEffect(() => {
    if (projectId) {
      loadProjectData(projectId);
    } else {
      loadFromLocalStorage();
    }
  }, [projectId, loadFromLocalStorage]);

  const loadProjectData = async (id: string) => {
    try {
      const response = await apiService.getProject(id);
      if (response.data?.project?.data) {
        const projectData = response.data.project.data;
        const { loadFromProjectData } = useEditorStore.getState();
        loadFromProjectData({
          layers: projectData.layers || [],
          elements: projectData.elements || [],
          activeLayerId: projectData.activeLayerId || '',
          snapSettings: projectData.snapSettings,
        });
      }
    } catch {
      loadFromLocalStorage();
    }
  };

  // Autosave
  const autosave = useCallback(() => {
    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    autosaveTimeoutRef.current = setTimeout(async () => {
      if (projectId) {
        try {
          const state = useEditorStore.getState();
          await apiService.saveProjectData(projectId, {
            layers: state.layers,
            elements: state.elements,
            activeLayerId: state.activeLayerId,
            snapSettings: state.snapSettings,
            drawingSettings: state.drawingSettings,
            pdfBackground: state.pdfBackground,
          });
        } catch {
          saveToLocalStorage();
        }
      } else {
        saveToLocalStorage();
      }
    }, AUTOSAVE_DEBOUNCE);
  }, [projectId, saveToLocalStorage]);

  useEffect(() => { autosave(); }, [elements, layers, pdfBackground, autosave]);

  useEffect(() => {
    const handleBeforeUnload = () => saveToLocalStorage();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    };
  }, [saveToLocalStorage]);

  const isDark = resolvedTheme === 'dark';

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: isDark ? '#020617' : '#f8fafc' }}
    >
      {/* Top Bar */}
      <TopBar
        onBackToProjects={onBackToProjects}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
        onToggleBlocks={() => setShowBlocks(!showBlocks)}
        onToggleLayers={() => setShowLayers(!showLayers)}
        onToggleProperties={() => setShowProperties(!showProperties)}
        onTogglePlacement={() => setShowPlacement(!showPlacement)}
        onToggleItemsList={() => setShowItemsList(!showItemsList)}
        onToggleGlobalAttributes={() => setShowGlobalAttributes(!showGlobalAttributes)}
        showBlocks={showBlocks}
        showLayers={showLayers}
        showProperties={showProperties}
        showPlacement={showPlacement}
        showItemsList={showItemsList}
        showGlobalAttributes={showGlobalAttributes}
      />

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <LeftToolbar />

        {/* Canvas - switches based on view mode */}
        <div className="flex-1 relative overflow-hidden">
          {viewMode === 'floorPlan' && (
            <>
              <AdvancedCanvas />
              <PDFPageChanger />
            </>
          )}
          {viewMode === 'drawingLayout' && (
            <DrawingLayoutCanvas />
          )}
          
          {/* Placement Box - Floating */}
          {showPlacement && (
            <div className="absolute top-4 left-4 z-50">
              <PlacementBox onClose={() => setShowPlacement(false)} />
            </div>
          )}
          
          {/* Items List - Floating */}
          {showItemsList && (
            <div className="absolute top-4 right-4 z-50">
              <ItemsListPanel onClose={() => setShowItemsList(false)} />
            </div>
          )}
          
          {/* Global Attributes - Floating */}
          {showGlobalAttributes && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
              <GlobalAttributesPanel onClose={() => setShowGlobalAttributes(false)} />
            </div>
          )}
        </div>

        {/* Right Panels */}
        {(showBlocks || showLayers || showProperties) && (
          <div className="flex gap-2 p-2" style={{ maxWidth: showBlocks && showLayers && showProperties ? 720 : 480 }}>
            {showBlocks && <ModernBlocksPanel onClose={() => setShowBlocks(false)} />}
            {showLayers && <ModernLayersPanel onClose={() => setShowLayers(false)} />}
            {showProperties && <ModernPropertiesPanel onClose={() => setShowProperties(false)} />}
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <BottomBar />

      {/* Command Palette */}
      {showCommandPalette && <CommandPalette onClose={() => setShowCommandPalette(false)} />}
    </div>
  );
};
