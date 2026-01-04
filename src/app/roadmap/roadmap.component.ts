import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoadmapService } from '../roadmap.service';
import { ProjectBubbleComponent } from '../project-bubble/project-bubble.component';
import { ProjectBubble } from '../models/project.model';
import { ProjectEditModalComponent } from '../project-edit-modal/project-edit-modal.component';
import { ROADMAP_CONFIG } from '../models/project.constants';
import { range } from 'rxjs';

@Component({
  selector: 'app-roadmap',
  standalone: true,
  imports: [CommonModule, ProjectBubbleComponent, ProjectEditModalComponent],
  templateUrl: './roadmap.component.html',
  styleUrl: './roadmap.component.css'
})
export class RoadmapComponent implements OnInit {
  roadmapService = inject(RoadmapService);
  projects = this.roadmapService.projects;

  // Expose configuration to template
  readonly CONFIG = ROADMAP_CONFIG;

  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // State for editing and selection
  activeProject = signal<ProjectBubble | null>(null);
  editingProject = signal<ProjectBubble | null>(null);
  isXAxisLocked = signal<boolean>(true);
  topmostProjectId = signal<number | null>(null);

  /**
   * Generates Y-axis ticks based on VALUE_RANGE.
   * Returns an array of numbers (e.g., [0, 100, 200, 300, 400, 500, 600])
   */
  get yAxisTicks(): number[] {
    const ticks = [];
    const step = 100;
    for (let i = 0; i <= this.CONFIG.VALUE_RANGE; i += step) {
      ticks.push(i);
    }
    return ticks;
  }

  // Constants defining the grid dimensions in pixels (must match CSS .roadmap-grid)
  private GRID_WIDTH = 1200;
  private GRID_HEIGHT = 600;


  serviceColors = [
    { name: 'Finance', class: 'finance-bubble' },
    { name: 'Marketing', class: 'marketing-bubble' },
    { name: 'IT', class: 'it-bubble' },
    { name: 'HR', class: 'hr-bubble' },
  ];

  complexityLegend = [
    { label: 'XS', size: 50, description: 'very simple', range: [0, 50] },
    { label: 'S', size: 100, description: 'simple', range: [50, 100] },
    { label: 'M', size: 250, description: 'medium', range: [100, 250] },
    { label: 'L', size: 400, description: 'complex', range: [250, 400] },
    { label: 'XL', size: 500, description: 'very complex', range: [400, 500] }
  ];

  getLegendBubbleSize(complexity: number): number {
    // Map complexity (0-500) to pixel size (e.g., 20px to 80px)
    // Formula: minSize + (complexity / maxComplexity) * (maxSize - minSize)
    const minSize = 20;
    const maxSize = 80;
    const ratio = complexity / this.CONFIG.MAX_COMPLEXITY;
    return minSize + ratio * (maxSize - minSize);
  }

  ngOnInit(): void {
  }



  /**
   * Calculates the X position (in pixels) based on the project's start date (month).
   * Maps the date within the year to a position across the GRID_WIDTH.
   */
  calculateXPosition(date: Date): number {
    const month = date.getMonth(); // 0 (Jan) to 11 (Dec)
    const dayOfMonth = date.getDate();
    const daysInMonth = new Date(date.getFullYear(), month + 1, 0).getDate();

    // Calculate position within the month slot (0 to 1/12th of the width)
    const monthFraction = (dayOfMonth - 1) / daysInMonth;

    // Calculate total position: (Month Index + Fraction) / 12 * GRID_WIDTH
    const normalizedPosition = (month + monthFraction) / 12;

    // Return the position of the center point on the timeline
    return normalizedPosition * this.GRID_WIDTH;
  }

  /**
   * Calculates the Y position (in pixels) based on the project's value (0-50).
   * Maps Value 0 to 0px (bottom) and Value 50 to GRID_HEIGHT (top).
   */
  calculateYPosition(value: number): number {
    // Value 0 maps to 0px (bottom), Value 650 maps to 600px (top)
    const normalizedValue = Math.min(value, this.CONFIG.VALUE_RANGE) / this.CONFIG.VALUE_RANGE;
    return normalizedValue * this.GRID_HEIGHT;
  }

  openEditModal(project: ProjectBubble): void {
    this.editingProject.set(project);
    // When editing, also make it the active (visually selected) project
    this.activeProject.set(project);
  }

  closeEditModal(): void {
    this.editingProject.set(null);
  }

  /**
   * Selects a project (e.g., on single click) to persist hover-like styles.
   */
  selectProject(project: ProjectBubble): void {
    this.activeProject.set(project);
  }

  /**
   * Deselects the current project (e.g., when clicking the background).
   */
  deselectProject(): void {
    this.activeProject.set(null);
  }

  /**
   * Handles the end of a drag event, calculates new data values, and opens the modal.
   */
  handlePositionChange(event: { project: ProjectBubble, newX: number, newY: number }): void {
    const { project, newX, newY } = event;

    // 1. Calculate new Value (Y position)
    const normalizedValue = Math.max(0, Math.min(newY, this.GRID_HEIGHT)) / this.GRID_HEIGHT;
    // Map pixels to logical range (0-650), then clamp the actual data value to 500
    const calculatedValue = Math.round(normalizedValue * this.CONFIG.VALUE_RANGE);
    const newValue = Math.min(this.CONFIG.MAX_BUSINESS_VALUE, calculatedValue); // on bloque à 500 max 

    // 2. Calculate new Start Date (X position)
    const normalizedTime = Math.max(0, Math.min(newX, this.GRID_WIDTH)) / this.GRID_WIDTH; // 0 to 1
    const totalMonths = normalizedTime * 12;
    const monthIndex = Math.floor(totalMonths); // 0 to 11
    const dayFraction = totalMonths - monthIndex;

    const currentYear = new Date().getFullYear();
    const daysInNewMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
    const newDay = Math.max(1, Math.round(dayFraction * daysInNewMonth));

    const newStartDate = this.isXAxisLocked()
      ? project.startDate
      : new Date(currentYear, monthIndex, newDay);

    // Create a temporary project object with updated values
    const updatedProject: ProjectBubble = {
      ...project,
      value: newValue,
      startDate: newStartDate,
    };

    // Update the project directly in the service
    this.roadmapService.updateProject(updatedProject);

    // Maintain visual selection of the moved project
    this.activeProject.set(updatedProject);
  }

  /**
   * Handles the end of a resize drag event, updates complexity, and opens the modal.
   */
  handleComplexityChange(event: { project: ProjectBubble, newComplexity: number }): void {
    const { project, newComplexity } = event;

    // Create a temporary project object with updated complexity
    const updatedProject: ProjectBubble = {
      ...project,
      complexity: newComplexity,
    };

    // Update the project directly in the service
    this.roadmapService.updateProject(updatedProject);

    // Maintain visual selection
    this.activeProject.set(updatedProject);
  }
}