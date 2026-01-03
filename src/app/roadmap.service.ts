import { Injectable, signal, computed, Signal } from '@angular/core';
import { ProjectBubble } from './models/project.model';
import { DEFAULT_PROJECTS } from './models/project.constants';

@Injectable({
  providedIn: 'root'
})
export class RoadmapService {
  private projectsSource = signal<ProjectBubble[]>([...DEFAULT_PROJECTS]);

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

  // Function to save project (add or update)
  saveProject(project: ProjectBubble): void {
    if (project.id === 0) {
      this.addProject(project);
    } else {
      this.updateProject(project);
    }
  }

  // Internal function to add a new project
  private addProject(project: ProjectBubble): void {
    this.projectsSource.update(projects => {
      const maxId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) : 0;
      const newProject = { ...project, id: maxId + 1 };
      return [...projects, newProject];
    });
  }

  // Function to update project details
  updateProject(updatedProject: ProjectBubble): void {
    this.projectsSource.update(projects =>
      projects.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
  }

  // Function to delete a project
  deleteProject(id: number): void {
    this.projectsSource.update(projects =>
      projects.filter(p => p.id !== id)
    );
  }

  // Function to replace all projects (for Import feature)
  replaceProjects(newProjects: ProjectBubble[]): void {
    // Ensure that startDate strings are converted back to Date objects
    const validatedProjects = newProjects.map(p => ({
      ...p,
      startDate: new Date(p.startDate)
    }));
    this.projectsSource.set(validatedProjects);
  }

  // Function to restore default projects
  restoreDefaults(): void {
    this.projectsSource.set([...DEFAULT_PROJECTS]);
  }
}