import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoadmapComponent } from './roadmap/roadmap.component';
import { ProjectListComponent } from './project-list/project-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RoadmapComponent, ProjectListComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Project Roadmap';
  currentView: 'dashboard' | 'list' = 'dashboard';

  setView(view: 'dashboard' | 'list'): void {
    this.currentView = view;
  }
}