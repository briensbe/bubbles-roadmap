import { Injectable, signal, computed, Signal } from '@angular/core';
import { ProjectBubble } from './models/project.model';

@Injectable({
  providedIn: 'root'
})
export class RoadmapService {
  private projectsSource = signal<ProjectBubble[]>([
    { id: 1, name: 'ERP Migration', service: 'Finance', complexity: 450, value: 480, startDate: new Date(2026, 4, 15) }, // May
    { id: 2, name: 'Website Redesign', service: 'Marketing', complexity: 200, value: 350, startDate: new Date(2026, 6, 1) }, // July
    { id: 3, name: 'Cloud Security Audit', service: 'IT', complexity: 300, value: 150, startDate: new Date(2026, 8, 10) }, // September
    { id: 4, name: 'Recruitment Portal', service: 'HR', complexity: 100, value: 250, startDate: new Date(2026, 5, 20) }, // June
    { id: 5, name: 'Q3 Budget Planning', service: 'Finance', complexity: 50, value: 400, startDate: new Date(2026, 7, 5) }, // August
  ]);

  readonly projects: Signal<ProjectBubble[]> = this.projectsSource.asReadonly();

  constructor() { }

  // Utility to map service to a color class (for CSS)
  getServiceColor(service: ProjectBubble['service']): string {
    switch (service) {
      case 'Finance': return 'finance-bubble';
      case 'Marketing': return 'marketing-bubble';
      case 'IT': return 'it-bubble';
      case 'HR': return 'hr-bubble';
      default: return 'default-bubble';
    }
  }

  // Function to update project position after dragging (if needed later)
  updateProjectPosition(id: number, newX: number, newY: number): void {
    this.projectsSource.update(projects =>
      projects.map(p => p.id === id ? { ...p, x: newX, y: newY } : p)
    );
  }

  // New function to update project details
  updateProject(updatedProject: ProjectBubble): void {
    this.projectsSource.update(projects =>
      projects.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
  }
}