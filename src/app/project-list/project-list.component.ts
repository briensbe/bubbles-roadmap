import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RoadmapService } from '../roadmap.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.css'
})
export class ProjectListComponent {
  roadmapService = inject(RoadmapService);
  projects = this.roadmapService.projects;
}