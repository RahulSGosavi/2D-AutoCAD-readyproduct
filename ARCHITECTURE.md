# AutoCAD-Style 2D Editor System - Architecture

## Overview
This is a comprehensive AutoCAD-style 2D editor built with React + TypeScript + Konva. The system is designed with a clean, modular architecture with NO duplicate tools or UI components.

## Completed Components

### 1. State Management (`src/state/useEditorStore.ts`)
- ✅ Complete Zustand store with all editor state
- ✅ Tools, layers, elements, snap settings, drawing settings
- ✅ Undo/Redo command stack
- ✅ Pointer tracking with throttling
- ✅ Stage transform management

### 2. UI Components

#### Top Bar (`src/layout/AutoCADTopBar.tsx`)
- ✅ File menu (New, Open, Save, Export PNG/SVG/PDF/DXF placeholder)
- ✅ Edit menu (Undo, Redo, Cut, Copy, Paste, Delete)
- ✅ View menu (Zoom In/Out/Fit/Selection, Reset View, Toggle Grid/Rulers/Smart Guides)
- ✅ Draw menu (Line, Polyline, Rectangle, Circle, Arc, Ellipse, Freehand)
- ✅ Modify menu (Move, Rotate, Scale, Mirror, Offset, Trim, Extend, Fillet, Chamfer, Join, Explode)
- ✅ Layout menu (Layers Panel, Color Palette, Line Weight, Line Type, Snapping Controls)
- ✅ Annotate menu (Linear Dimension, Aligned, Angular, Radius/Diameter, Room Area, Text, Leader)

#### Sidebar (`src/layout/AutoCADSidebar.tsx`)
- ✅ Selection/Navigation tools (Select, Pan, Measure, Zoom)
- ✅ Drawing tools (Line, Polyline, Rectangle, Circle, Arc, Ellipse, Freehand)
- ✅ Modify tools (Move, Rotate, Scale, Offset, Trim, Extend, Fillet, Chamfer)
- ✅ Architectural tools (Wall, Door, Window, Column, Beam)
- ✅ Interior elements (Kitchen, Bathroom, Furniture)
- ✅ Electrical + Plumbing tools
- ✅ Dimensions (Linear, Aligned, Angular, Radius)
- ✅ Annotations (Text, Room Label, North Symbol, Scale Bar)

#### Status Bar (`src/layout/AutoCADStatusBar.tsx`)
- ✅ Cursor coordinates (X, Y)
- ✅ Current snap mode display
- ✅ Grid status (ON/OFF)
- ✅ Ortho status (ON/OFF)
- ✅ Zoom percentage
- ✅ Selected layer name
- ✅ Active tool name

### 3. Canvas Components

#### Advanced Canvas (`src/canvas/AdvancedCanvas.tsx`)
- ✅ Base structure with Stage setup
- ✅ Smooth pointer-centered zoom
- ✅ Smooth pan support
- ✅ Crosshair cursor
- ✅ Selection window foundation (blue/green)
- ✅ Snap point visualization
- ✅ Grid integration
- ⚠️ **Needs**: Full integration with existing FloorCanvas drawing logic

#### Supporting Components
- ✅ `AutoCADRulers.tsx` - Top and left rulers with tick marks
- ✅ `SelectionWindow.tsx` - Blue (inside) / Green (touch) selection boxes
- ✅ `SmartGuides.tsx` - Figma-style alignment guides
- ✅ `GridBackground.tsx` - Infinite grid (already exists)

### 4. Engine Components

#### Snapping Engine (`src/engine/snapping-engine.ts`)
- ✅ Endpoint snapping
- ✅ Midpoint snapping
- ✅ Grid snapping
- ✅ Intersection snapping (foundation)
- ⚠️ **Needs**: Perpendicular, Parallel, Angle snapping implementation

### 5. Panels

#### Layers Panel (`src/components/AutoCADLayersPanel.tsx`)
- ✅ Add layer
- ✅ Delete layer (via store)
- ✅ Hide/Show toggle
- ✅ Lock/Unlock toggle
- ✅ Rename (double-click)
- ✅ Color indicator
- ⚠️ **Needs**: Set color, set line weight per layer

#### Blocks Panel (`src/components/AutoCADBlocksPanel.tsx`)
- ✅ Kitchen blocks (Base Cabinet, Wall Cabinet, Sink, Hob, Refrigerator, Microwave)
- ✅ Bathroom blocks (WC, Wash Basin, Shower Panel, Floor Drain)
- ✅ Furniture blocks (Bed, Sofa, Table, Wardrobe, TV Unit)
- ✅ Electrical blocks (Switchboard, Socket, Light, Fan, AC)
- ✅ Plumbing blocks (Water Line, Drain Pipe)
- ✅ Drag-and-drop support
- ✅ Click-to-add support

#### Color Palette (`src/components/AutoCADColorPalette.tsx`)
- ✅ 24 preset colors
- ✅ Color picker
- ✅ Stroke color selection
- ✅ Fill color selection
- ✅ Stroke thickness slider (0.5px - 10px)
- ✅ Line type selector (Solid, Dashed, Dotted, Dash-Dot)
- ✅ Opacity slider (UI ready, needs store integration)

### 6. Main Layout (`src/layout/AutoCADMainLayout.tsx`)
- ✅ Complete layout structure
- ✅ Top bar integration
- ✅ Left sidebar integration
- ✅ Right sidebar with tabbed panels (Layers, Blocks, Colors)
- ✅ Status bar integration
- ✅ Canvas area

## What Needs Implementation

### 1. Drawing Tools Integration
The `AdvancedCanvas` needs to integrate the full drawing logic from `FloorCanvas.tsx`:
- Line tool with draft preview
- Polyline tool with multi-point support
- Rectangle tool with live preview
- Circle tool with radius preview
- Arc tool (3-point)
- Ellipse tool
- Freehand/Pencil tool with smoothing

### 2. Modify Tools
- Move tool with drag support
- Rotate tool with rotation handle
- Scale tool with corner handles
- Mirror tool (flip horizontal/vertical)
- Offset tool (parallel offset)
- Trim tool (already partially implemented)
- Extend tool (already partially implemented)
- Fillet tool (rounded corners)
- Chamfer tool (beveled corners)
- Join tool (connect segments)
- Explode tool (break into primitives)

### 3. Architectural Tools
- Wall tool with auto-join logic (partially exists in `wall-core.ts`)
- Door tool with swing arc and auto wall cut
- Window tool with auto wall cut
- Column tool
- Beam tool

### 4. Dimension Engine
- Linear dimension (partially exists)
- Aligned dimension
- Angular dimension
- Radius/Diameter dimension
- Room area calculation and label

### 5. Snapping Engine Enhancements
- Perpendicular snap (snap to perpendicular line)
- Parallel snap (snap to parallel line)
- Angle snap (snap to specific angles with step)
- Intersection snap (full implementation)

### 6. Selection Window Logic
- Blue window (left-to-right): Select elements fully inside
- Green window (right-to-left): Select elements that touch
- Multi-select with Shift/Ctrl
- Selection highlighting

### 7. Smart Guides
- Horizontal alignment guides
- Vertical alignment guides
- Distance guides
- Center alignment guides

### 8. Additional Features
- Line type rendering (dashed, dotted, etc.)
- Opacity support in drawing settings
- Rulers toggle functionality
- Smart guides toggle functionality
- Copy/Paste with clipboard
- Cut functionality
- Export DXF (placeholder exists)

### 9. Performance Optimizations
- Layer batching for rendering
- Shape caching where appropriate
- Minimize re-renders with proper memoization
- RequestAnimationFrame for all pointer updates
- Virtual scrolling for large element lists

## File Structure

```
src/
├── layout/
│   ├── AutoCADMainLayout.tsx      ✅ Complete
│   ├── AutoCADTopBar.tsx          ✅ Complete
│   ├── AutoCADSidebar.tsx         ✅ Complete
│   └── AutoCADStatusBar.tsx       ✅ Complete
├── canvas/
│   ├── AdvancedCanvas.tsx         ⚠️ Foundation (needs drawing integration)
│   ├── AutoCADRulers.tsx          ✅ Complete
│   ├── SelectionWindow.tsx        ✅ Complete
│   ├── SmartGuides.tsx            ✅ Complete
│   └── GridBackground.tsx         ✅ Exists
├── components/
│   ├── AutoCADLayersPanel.tsx     ✅ Complete
│   ├── AutoCADBlocksPanel.tsx     ✅ Complete
│   └── AutoCADColorPalette.tsx    ✅ Complete
├── engine/
│   ├── snapping-engine.ts         ⚠️ Partial (needs perpendicular/parallel/angle)
│   ├── geometry-core.ts           ✅ Exists
│   ├── wall-core.ts               ✅ Exists
│   └── dimension-core.ts          ✅ Exists
└── state/
    └── useEditorStore.ts          ✅ Complete
```

## Next Steps

1. **Integrate Drawing Tools**: Merge `FloorCanvas.tsx` drawing logic into `AdvancedCanvas.tsx`
2. **Complete Modify Tools**: Implement all modify operations
3. **Enhance Snapping**: Add perpendicular, parallel, and angle snapping
4. **Selection Window**: Implement full selection logic
5. **Smart Guides**: Calculate and display alignment guides
6. **Performance**: Optimize rendering and pointer updates
7. **Testing**: Test all tools and workflows

## Notes

- The architecture is modular and extensible
- No duplicate tools or UI components
- All state is centralized in Zustand store
- Components are reusable and well-separated
- The foundation is solid for adding remaining features

