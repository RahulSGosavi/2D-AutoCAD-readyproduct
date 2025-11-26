import type { ReactNode } from 'react';
import TopBar from './TopBar';
import SideTools from './SideTools';
import BottomStatusBar from './BottomStatusBar';
import ColorPicker from '../components/ColorPicker';
import UnitSelector from '../components/UnitSelector';
import ViewControls from '../components/ViewControls';
import ElementLibrary from '../components/ElementLibrary';
import CabinetConfigurator from '../components/CabinetConfigurator';
import CatalogImportPanel from '../components/CatalogImportPanel';
import ParametricToolsPanel from '../components/ParametricToolsPanel';
import DimensionSettingsPanel from '../components/DimensionSettingsPanel';
import VersionHistoryPanel from '../components/VersionHistoryPanel';
import ShareProjectPanel from '../components/ShareProjectPanel';

type AutoCADLayoutProps = {
  children: ReactNode;
};

const AutoCADLayout = ({ children }: AutoCADLayoutProps) => {
  return (
    <div className="flex h-screen flex-col bg-surface text-slate-100 transition-all duration-300">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <SideTools />
        <main className="flex-1 overflow-hidden transition-all duration-300">{children}</main>
        <div className="hidden lg:flex w-72 border-l border-outline bg-surface-sunken/90 overflow-y-auto p-3 flex-col gap-4 transition-all duration-300">
          <ViewControls />
          <ColorPicker />
          <UnitSelector />
          <ElementLibrary />
          <CabinetConfigurator />
          <CatalogImportPanel />
          <ParametricToolsPanel />
          <DimensionSettingsPanel />
          <VersionHistoryPanel />
          <ShareProjectPanel />
        </div>
      </div>
      <BottomStatusBar />
    </div>
  );
};

export default AutoCADLayout;

