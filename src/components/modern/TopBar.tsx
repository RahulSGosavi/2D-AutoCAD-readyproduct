// src/components/modern/TopBar.tsx
import React from 'react';
import { ArrowLeft, Search, Grid3X3, Layers, Settings2, Crosshair, List, Palette } from 'lucide-react';
import { useThemeStore } from '../../state/useThemeStore';

interface TopBarProps {
  onBackToProjects?: () => void;
  onOpenCommandPalette: () => void;
  onToggleBlocks: () => void;
  onToggleLayers: () => void;
  onToggleProperties: () => void;
  onTogglePlacement?: () => void;
  onToggleItemsList?: () => void;
  onToggleGlobalAttributes?: () => void;
  showBlocks: boolean;
  showLayers: boolean;
  showProperties: boolean;
  showPlacement?: boolean;
  showItemsList?: boolean;
  showGlobalAttributes?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  onBackToProjects,
  onOpenCommandPalette,
  onToggleBlocks,
  onToggleLayers,
  onToggleProperties,
  onTogglePlacement,
  onToggleItemsList,
  onToggleGlobalAttributes,
  showBlocks,
  showLayers,
  showProperties,
  showPlacement,
  showItemsList,
  showGlobalAttributes,
}) => {
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  const bgColor = isDark ? '#0f172a' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';
  const textColor = isDark ? '#e2e8f0' : '#1e293b';
  const mutedColor = isDark ? '#64748b' : '#94a3b8';

  return (
    <div
      className="flex items-center justify-between px-2 z-50"
      style={{
        height: 40,
        backgroundColor: bgColor,
        borderBottom: `1px solid ${borderColor}`,
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-2">
        {onBackToProjects && (
          <button
            onClick={onBackToProjects}
            className="flex items-center gap-1 px-2 py-1 rounded transition-colors"
            style={{ color: mutedColor, fontSize: 12 }}
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
        )}
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center justify-center rounded"
            style={{
              width: 24,
              height: 24,
              background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
            }}
          >
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>K</span>
          </div>
          <span style={{ color: textColor, fontWeight: 600, fontSize: 13 }}>KAB Studio</span>
        </div>
      </div>

      {/* Center - Command Search */}
      <button
        onClick={onOpenCommandPalette}
        className="flex items-center gap-2 px-3 py-1 rounded-lg transition-colors"
        style={{
          backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
          border: `1px solid ${borderColor}`,
          color: mutedColor,
          fontSize: 12,
          minWidth: 200,
        }}
      >
        <Search size={12} />
        <span>Search...</span>
        <div className="flex-1" />
        <kbd style={{ fontSize: 10, backgroundColor: isDark ? '#334155' : '#e2e8f0', padding: '1px 4px', borderRadius: 3 }}>
          ⌘K
        </kbd>
      </button>

      {/* Right - Panel Toggles */}
      <div className="flex items-center gap-1">
        {onTogglePlacement && (
          <button
            onClick={onTogglePlacement}
            title="Placement Box (Wall Distance)"
            className="flex items-center justify-center rounded transition-colors"
            style={{
              width: 28,
              height: 28,
              color: showPlacement ? '#f59e0b' : mutedColor,
              backgroundColor: showPlacement ? (isDark ? '#f59e0b20' : '#f59e0b10') : 'transparent',
            }}
          >
            <Crosshair size={16} />
          </button>
        )}
        {onToggleItemsList && (
          <button
            onClick={onToggleItemsList}
            title="Items List (Quote)"
            className="flex items-center justify-center rounded transition-colors"
            style={{
              width: 28,
              height: 28,
              color: showItemsList ? '#ec4899' : mutedColor,
              backgroundColor: showItemsList ? (isDark ? '#ec489920' : '#ec489910') : 'transparent',
            }}
          >
            <List size={16} />
          </button>
        )}
        {onToggleGlobalAttributes && (
          <button
            onClick={onToggleGlobalAttributes}
            title="Global Attributes"
            className="flex items-center justify-center rounded transition-colors"
            style={{
              width: 28,
              height: 28,
              color: showGlobalAttributes ? '#a855f7' : mutedColor,
              backgroundColor: showGlobalAttributes ? (isDark ? '#a855f720' : '#a855f710') : 'transparent',
            }}
          >
            <Palette size={16} />
          </button>
        )}
        <button
          onClick={onToggleBlocks}
          title="Blocks"
          className="flex items-center justify-center rounded transition-colors"
          style={{
            width: 28,
            height: 28,
            color: showBlocks ? '#0ea5e9' : mutedColor,
            backgroundColor: showBlocks ? (isDark ? '#0ea5e920' : '#0ea5e910') : 'transparent',
          }}
        >
          <Grid3X3 size={16} />
        </button>
        <button
          onClick={onToggleLayers}
          title="Layers"
          className="flex items-center justify-center rounded transition-colors"
          style={{
            width: 28,
            height: 28,
            color: showLayers ? '#8b5cf6' : mutedColor,
            backgroundColor: showLayers ? (isDark ? '#8b5cf620' : '#8b5cf610') : 'transparent',
          }}
        >
          <Layers size={16} />
        </button>
        <button
          onClick={onToggleProperties}
          title="Properties"
          className="flex items-center justify-center rounded transition-colors"
          style={{
            width: 28,
            height: 28,
            color: showProperties ? '#10b981' : mutedColor,
            backgroundColor: showProperties ? (isDark ? '#10b98120' : '#10b98110') : 'transparent',
          }}
        >
          <Settings2 size={16} />
        </button>
      </div>
    </div>
  );
};

