// src/utils/linkMode.ts
// Link Mode utilities - Keep walls connected when editing

import type { EditorElement, WallElement } from '../state/useEditorStore';

interface Point {
  x: number;
  y: number;
}

const LINK_THRESHOLD = 10; // Distance threshold for considering walls connected

// Get wall endpoints
export const getWallEndpoints = (wall: WallElement): { start: Point; end: Point } | null => {
  const pts = wall.points;
  if (!pts || pts.length < 4) return null;
  
  return {
    start: { x: (wall.x || 0) + pts[0], y: (wall.y || 0) + pts[1] },
    end: { x: (wall.x || 0) + pts[pts.length - 2], y: (wall.y || 0) + pts[pts.length - 1] },
  };
};

// Check if two points are close enough to be considered connected
export const pointsAreConnected = (p1: Point, p2: Point, threshold = LINK_THRESHOLD): boolean => {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y) <= threshold;
};

// Find all walls connected to a given wall
export const findConnectedWalls = (
  wallId: string,
  allElements: EditorElement[]
): { wallId: string; connectionType: 'start-start' | 'start-end' | 'end-start' | 'end-end' }[] => {
  const wall = allElements.find(el => el.id === wallId && el.type === 'wall') as WallElement | undefined;
  if (!wall) return [];
  
  const endpoints = getWallEndpoints(wall);
  if (!endpoints) return [];
  
  const connections: { wallId: string; connectionType: 'start-start' | 'start-end' | 'end-start' | 'end-end' }[] = [];
  
  const walls = allElements.filter(el => el.type === 'wall' && el.id !== wallId) as WallElement[];
  
  for (const otherWall of walls) {
    const otherEndpoints = getWallEndpoints(otherWall);
    if (!otherEndpoints) continue;
    
    // Check all possible connections
    if (pointsAreConnected(endpoints.start, otherEndpoints.start)) {
      connections.push({ wallId: otherWall.id, connectionType: 'start-start' });
    }
    if (pointsAreConnected(endpoints.start, otherEndpoints.end)) {
      connections.push({ wallId: otherWall.id, connectionType: 'start-end' });
    }
    if (pointsAreConnected(endpoints.end, otherEndpoints.start)) {
      connections.push({ wallId: otherWall.id, connectionType: 'end-start' });
    }
    if (pointsAreConnected(endpoints.end, otherEndpoints.end)) {
      connections.push({ wallId: otherWall.id, connectionType: 'end-end' });
    }
  }
  
  return connections;
};

// Update connected walls when a wall is moved
export const getLinkedWallUpdates = (
  movedWallId: string,
  deltaX: number,
  deltaY: number,
  allElements: EditorElement[],
  linkMode: boolean
): { id: string; updates: Partial<WallElement> }[] => {
  if (!linkMode) return [];
  
  const updates: { id: string; updates: Partial<WallElement> }[] = [];
  const connections = findConnectedWalls(movedWallId, allElements);
  
  const movedWall = allElements.find(el => el.id === movedWallId) as WallElement | undefined;
  if (!movedWall) return updates;
  
  const movedEndpoints = getWallEndpoints(movedWall);
  if (!movedEndpoints) return updates;
  
  // For each connected wall, update its endpoint to stay connected
  for (const connection of connections) {
    const connectedWall = allElements.find(el => el.id === connection.wallId) as WallElement | undefined;
    if (!connectedWall) continue;
    
    const connectedEndpoints = getWallEndpoints(connectedWall);
    if (!connectedEndpoints) continue;
    
    const pts = [...(connectedWall.points || [])];
    if (pts.length < 4) continue;
    
    // Determine which point of the connected wall needs to move
    switch (connection.connectionType) {
      case 'start-start':
      case 'end-start':
        // Connected wall's start point should move with the moved wall
        pts[0] += deltaX;
        pts[1] += deltaY;
        break;
      case 'start-end':
      case 'end-end':
        // Connected wall's end point should move with the moved wall
        pts[pts.length - 2] += deltaX;
        pts[pts.length - 1] += deltaY;
        break;
    }
    
    updates.push({
      id: connection.wallId,
      updates: { points: pts },
    });
  }
  
  return updates;
};

// Update connected walls when a wall endpoint is stretched
export const getLinkedWallStretchUpdates = (
  stretchedWallId: string,
  stretchedEndpoint: 'start' | 'end',
  newPosition: Point,
  allElements: EditorElement[],
  linkMode: boolean
): { id: string; updates: Partial<WallElement> }[] => {
  if (!linkMode) return [];
  
  const updates: { id: string; updates: Partial<WallElement> }[] = [];
  const connections = findConnectedWalls(stretchedWallId, allElements);
  
  // Find walls connected to the stretched endpoint
  const relevantConnections = connections.filter(c => {
    if (stretchedEndpoint === 'start') {
      return c.connectionType === 'start-start' || c.connectionType === 'start-end';
    } else {
      return c.connectionType === 'end-start' || c.connectionType === 'end-end';
    }
  });
  
  for (const connection of relevantConnections) {
    const connectedWall = allElements.find(el => el.id === connection.wallId) as WallElement | undefined;
    if (!connectedWall) continue;
    
    const pts = [...(connectedWall.points || [])];
    if (pts.length < 4) continue;
    
    const wallX = connectedWall.x || 0;
    const wallY = connectedWall.y || 0;
    
    // Update the connected endpoint
    if (connection.connectionType.endsWith('start')) {
      pts[0] = newPosition.x - wallX;
      pts[1] = newPosition.y - wallY;
    } else {
      pts[pts.length - 2] = newPosition.x - wallX;
      pts[pts.length - 1] = newPosition.y - wallY;
    }
    
    updates.push({
      id: connection.wallId,
      updates: { points: pts },
    });
  }
  
  return updates;
};

// Build wall connection graph for the entire design
export const buildWallConnectionGraph = (
  elements: EditorElement[]
): Map<string, string[]> => {
  const graph = new Map<string, string[]>();
  const walls = elements.filter(el => el.type === 'wall') as WallElement[];
  
  for (const wall of walls) {
    const connections = findConnectedWalls(wall.id, elements);
    graph.set(wall.id, connections.map(c => c.wallId));
  }
  
  return graph;
};

// Update wall's connectedWalls property
export const updateWallConnections = (
  wallId: string,
  elements: EditorElement[]
): string[] => {
  const connections = findConnectedWalls(wallId, elements);
  return connections.map(c => c.wallId);
};

