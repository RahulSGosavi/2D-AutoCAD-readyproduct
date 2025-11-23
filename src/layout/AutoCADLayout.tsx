import type { ReactNode } from 'react';
import TopBar from './TopBar';
import SideTools from './SideTools';
import BottomStatusBar from './BottomStatusBar';
import ColorPicker from '../components/ColorPicker';
import UnitSelector from '../components/UnitSelector';
import ViewControls from '../components/ViewControls';
import ElementLibrary from '../components/ElementLibrary';

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
        <div className="hidden lg:flex w-64 border-l border-outline bg-surface-sunken/90 overflow-y-auto p-2 flex-col gap-4 transition-all duration-300">
          <ViewControls />
          <ColorPicker />
          <UnitSelector />
          <ElementLibrary />
        </div>
      </div>
      <BottomStatusBar />
    </div>
  );
};

export default AutoCADLayout;

