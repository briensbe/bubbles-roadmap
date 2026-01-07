import { Signal } from '@angular/core';

export interface ProjectBubble {
  id: number;
  projectKey?: string; // Optional project key (e.g., PROJ-123)
  name: string;
  service: string; // Dynamic service name
  complexity: number; // 0-500, determines size
  value: number; // 0-500, determines Y position
  startDate: Date; // Determines initial X position

  // Runtime properties for positioning (optional, but useful if dragging updates position)
  x?: number; // Normalized X position (e.g., 0 to 100)
  y?: number; // Normalized Y position (e.g., 0 to 100)
}

export interface RoadmapState {
  projects: ProjectBubble[];
}