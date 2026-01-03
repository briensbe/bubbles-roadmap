import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RoadmapService } from '../roadmap.service';
import { ROADMAP_CONFIG } from '../models/project.constants';
import { ProjectBubble } from '../models/project.model';
import { ProjectEditModalComponent } from '../project-edit-modal/project-edit-modal.component';
import { ProjectJsonModalComponent } from '../project-json-modal/project-json-modal.component';
import { ProjectExcelModalComponent } from '../project-excel-modal/project-excel-modal.component';
import {
  LucideAngularModule,
  Pencil,
  Trash2,
  PlusCircle,
  RefreshCw,
  FileJson,
  FileSpreadsheet
} from 'lucide-angular';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ProjectEditModalComponent,
    ProjectJsonModalComponent,
    ProjectExcelModalComponent,
    LucideAngularModule
  ],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.css'
})
export class ProjectListComponent {
  roadmapService = inject(RoadmapService);
  projects = this.roadmapService.projects;

  readonly CONFIG = ROADMAP_CONFIG;

  // Icons for the template
  readonly Pencil = Pencil;
  readonly Trash2 = Trash2;
  readonly PlusCircle = PlusCircle;
  readonly RefreshCw = RefreshCw;
  readonly FileJson = FileJson;
  readonly FileSpreadsheet = FileSpreadsheet;

  // State for editing
  editingProject = signal<ProjectBubble | null>(null);
  isJsonModalOpen = signal<boolean>(false);
  isExcelModalOpen = signal<boolean>(false);

  openEditModal(project: ProjectBubble | null): void {
    if (project) {
      this.editingProject.set(project);
    } else {
      // Create a default new project
      this.editingProject.set({
        id: 0,
        name: 'New Project',
        service: 'IT',
        complexity: 100,
        value: 100,
        startDate: new Date()
      });
    }
  }

  closeEditModal(): void {
    this.editingProject.set(null);
  }

  deleteProject(id: number): void {
    if (confirm('Are you sure you want to delete this project?')) {
      this.roadmapService.deleteProject(id);
    }
  }

  restoreDefaults(): void {
    if (confirm('Are you sure you want to restore default projects? This will erase all your changes.')) {
      this.roadmapService.restoreDefaults();
    }
  }
}