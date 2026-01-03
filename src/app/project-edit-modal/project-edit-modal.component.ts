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

  // Available options for Service dropdown
  serviceOptions: ProjectBubble['service'][] = ['Finance', 'Marketing', 'IT', 'HR'];

  // Configuration (aligned with RoadmapComponent)
  readonly CONFIG = ROADMAP_CONFIG;

  ngOnInit(): void {
    // Create a deep copy of the project for editing
    this.editedProject = { ...this.project };
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
    this.roadmapService.updateProject(this.editedProject);
    this.close.emit();
  }

  cancel(): void {
    this.close.emit();
  }
}