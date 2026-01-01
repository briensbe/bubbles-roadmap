import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoadmapService } from '../roadmap.service';
import { ProjectBubbleComponent } from '../project-bubble/project-bubble.component';
import { ProjectBubble } from '../models/project.model';
import { ProjectEditModalComponent } from '../project-edit-modal/project-edit-modal.component';

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

  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // State for editing
  selectedProject = signal<ProjectBubble | null>(null);
  
  // Constants defining the grid dimensions in pixels (must match CSS .roadmap-grid)
  private GRID_WIDTH = 1200;
  private GRID_HEIGHT = 600;
  private VALUE_RANGE = 50; // Max value for Y axis
  
  // Constants for size scaling (must match ProjectBubbleComponent)
  private MIN_SIZE = 40;
  private MAX_SIZE = 120;
  private COMPLEXITY_RANGE = 50;

  serviceColors = [
    { name: 'Finance', class: 'finance-bubble' },
    { name: 'Marketing', class: 'marketing-bubble' },
    { name: 'IT', class: 'it-bubble' },
    { name: 'HR', class: 'hr-bubble' },
  ];

  ngOnInit(): void {
    // Initialization logic if needed
  }

  getBubbleSize(complexity: number): number {
    return this.MIN_SIZE + (complexity / this.COMPLEXITY_RANGE) * (this.MAX_SIZE - this.MIN_SIZE);
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
    // Value 0 maps to 0px (bottom), Value 50 maps to 600px (top)
    const normalizedValue = Math.min(value, this.VALUE_RANGE) / this.VALUE_RANGE;
    return normalizedValue * this.GRID_HEIGHT;
  }
  
  openEditModal(project: ProjectBubble): void {
    this.selectedProject.set(project);
  }
  
  closeEditModal(): void {
    this.selectedProject.set(null);
  }
  
  /**
   * Handles the end of a drag event, calculates new data values, and opens the modal.
   */
  handlePositionChange(event: { project: ProjectBubble, newX: number, newY: number }): void {
    const { project, newX, newY } = event;
    
    // 1. Calculate new Value (Y position)
    const normalizedValue = Math.max(0, Math.min(newY, this.GRID_HEIGHT)) / this.GRID_HEIGHT;
    const newValue = Math.round(normalizedValue * this.VALUE_RANGE);
    
    // 2. Calculate new Start Date (X position)
    const normalizedTime = Math.max(0, Math.min(newX, this.GRID_WIDTH)) / this.GRID_WIDTH; // 0 to 1
    const totalMonths = normalizedTime * 12;
    const monthIndex = Math.floor(totalMonths); // 0 to 11
    const dayFraction = totalMonths - monthIndex;
    
    const currentYear = new Date().getFullYear();
    const daysInNewMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
    const newDay = Math.max(1, Math.round(dayFraction * daysInNewMonth));
    
    const newStartDate = new Date(currentYear, monthIndex, newDay);
    
    // Create a temporary project object with updated values
    const updatedProject: ProjectBubble = {
      ...project,
      value: newValue,
      startDate: newStartDate,
    };
    
    // Open the modal with the updated project data for confirmation/further editing
    this.selectedProject.set(updatedProject);
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
    
    // Open the modal with the updated project data for confirmation/further editing
    this.selectedProject.set(updatedProject);
  }
}