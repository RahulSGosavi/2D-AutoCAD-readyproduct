# Debugging Drawing Issue

## Problem
Unable to draw anything on the canvas.

## Debugging Steps Added

I've added console logging to help identify the issue. Please:

1. **Open Browser Console** (F12 or Right-click → Inspect → Console tab)

2. **Try to draw** (click on Line, Rectangle, or any drawing tool, then click on canvas)

3. **Check Console Messages** - You should see:
   - `"Tool changed to: [tool name]"` - When you select a tool
   - `"Canvas size: {width: X, height: Y}"` - Canvas dimensions
   - `"Stage onPointerDown event: {tool: X, target: Y}"` - When you click
   - `"handlePointerDown called"` - Event handler triggered
   - `"Starting drawing with tool: X at point: {x: Y, y: Z}"` - Drawing started
   - `"Setting draft element for line: {...}"` - Draft element created

4. **Common Issues to Check:**

   **Issue 1: Canvas size is 0**
   - Look for: `Canvas size: {width: 0, height: 0}`
   - **Fix**: The canvas container might not be properly sized. Check if the parent container has proper height/width.

   **Issue 2: No active layer**
   - Look for: `"Cannot draw: missing point or activeLayerId"`
   - **Fix**: Check Layers panel - ensure at least one layer exists and is visible/unlocked

   **Issue 3: Tool not set**
   - Look for: `"handlePointerDown called"` with `tool: undefined` or `tool: 'select'`
   - **Fix**: Make sure you're clicking a drawing tool button (Line, Rectangle, etc.) before drawing

   **Issue 4: Layer is locked**
   - Look for: `"Cannot draw: active layer is locked"`
   - **Fix**: Unlock the layer in the Layers panel

   **Issue 5: Stage not initialized**
   - Look for: `"Cannot draw: stage not initialized"`
   - **Fix**: This shouldn't happen, but if it does, refresh the page

## Quick Fixes to Try

1. **Refresh the page** - Sometimes state gets corrupted
2. **Check Layers Panel** - Ensure a layer is selected and unlocked
3. **Select a drawing tool** - Click Line, Rectangle, or Circle in the sidebar
4. **Check canvas size** - Make sure the canvas area is visible and has size > 0
5. **Try different tools** - Test with Line, Rectangle, Circle to see if any work

## What the Console Should Show (Normal Flow)

When drawing works correctly, you should see:
```
Tool changed to: line
Canvas size: {width: 1920, height: 1080}
Stage initialized: {width: 1920, height: 1080}
Stage onPointerDown event: {tool: "line", target: Stage}
handlePointerDown called {tool: "line", activeLayerId: "...", layers: 1}
Starting drawing with tool: line at point: {x: 500, y: 300}
Setting draft element for line: {...}
```

If you see errors or warnings, share them and I can help fix the specific issue.

