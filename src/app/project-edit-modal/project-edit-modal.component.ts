import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectBubble } from '../models/project.model';
import { FormsModule } from '@angular/forms';
import { RoadmapService } from '../roadmap.service';

@Component({
  selector: 'app-project-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  ngOnInit(): void {
    // Create a deep copy of the project for editing
    this.editedProject = { ...this.project };
  }

  saveChanges(): void {
    this.roadmapService.updateProject(this.editedProject);
    this.close.emit();
  }

  cancel(): void {
    this.close.emit();
  }
}