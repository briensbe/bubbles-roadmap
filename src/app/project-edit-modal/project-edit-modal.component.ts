import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ProjectBubble } from '../models/project.model';
import { FormsModule } from '@angular/forms';
import { RoadmapService } from '../roadmap.service';
import { ROADMAP_CONFIG } from '../models/project.constants';

@Component({
  selector: 'app-project-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe], // Added DatePipe here
  templateUrl: './project-edit-modal.component.html',
  styleUrl: './project-edit-modal.component.css'
})
export class ProjectEditModalComponent implements OnInit {
  @Input({ required: true }) project!: ProjectBubble;
  @Output() close = new EventEmitter<void>();

  roadmapService = inject(RoadmapService);

  // Local state for form binding
  editedProject: ProjectBubble = {} as ProjectBubble;

  // Track where the mouse interaction started
  private mousedownTarget: EventTarget | null = null;

  // Available options for Service dropdown
  serviceOptions: string[] = [];

  // State for hybrid selection (Select + Text Input)
  isAddingNewService: boolean = false;
  selectedService: string = '';

  // Configuration (aligned with RoadmapComponent)
  readonly CONFIG = ROADMAP_CONFIG;

  complexityPresets = [
    { label: 'XS', value: 50 },
    { label: 'S', value: 100 },
    { label: 'M', value: 250 },
    { label: 'L', value: 400 },
    { label: 'XL', value: 500 }
  ];

  setComplexity(value: number): void {
    this.editedProject.complexity = value;
  }

  ngOnInit(): void {
    // Create a deep copy of the project for editing
    this.editedProject = { ...this.project };

    // Update service options with all distinct services currently in use
    const currentProjects = this.roadmapService.projects();
    const distinctServices = new Set<string>();

    // Add all services from existing projects
    currentProjects.forEach(p => {
      if (p.service) distinctServices.add(p.service);
    });

    // Also ensure the current project's service is in the list
    if (this.project.service) {
      distinctServices.add(this.project.service);
    }

    this.serviceOptions = Array.from(distinctServices).sort();

    // Initialize selection state
    if (this.project.service) {
      this.selectedService = this.project.service;
      this.isAddingNewService = false;
    } else {
      this.selectedService = '';
      this.isAddingNewService = false;
    }
  }

  onServiceChange(): void {
    if (this.selectedService === 'NEW_SERVICE') {
      this.isAddingNewService = true;
      this.editedProject.service = ''; // Clear for user to type
    } else {
      this.isAddingNewService = false;
      this.editedProject.service = this.selectedService;
    }
  }

  updateStartDate(dateString: string): void {
    if (dateString) {
      // When setting a date from an input type="date", we want to ensure it's treated as UTC midnight
      // to avoid timezone shifts when converting back to 'yyyy-MM-dd' for display.
      // However, since the input gives us a local date string, we can just create a new Date object from it.
      this.editedProject.startDate = new Date(dateString);
    }
  }

  saveChanges(): void {
    this.roadmapService.saveProject(this.editedProject);
    this.close.emit();
  }

  cancel(): void {
    this.close.emit();
  }

  onOverlayMousedown(event: MouseEvent): void {
    this.mousedownTarget = event.target;
  }

  handleOverlayClick(event: MouseEvent): void {
    // Only close if BOTH mousedown and click happened on the overlay itself.
    // This prevents closing when the user selects text inside and releases outside.
    if (
      event.target === event.currentTarget &&
      this.mousedownTarget === event.currentTarget
    ) {
      this.cancel();
    }
    // Reset for next interaction
    this.mousedownTarget = null;
  }
}