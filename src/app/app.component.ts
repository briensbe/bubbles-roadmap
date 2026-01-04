import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoadmapComponent } from './roadmap/roadmap.component';
import { ProjectListComponent } from './project-list/project-list.component';
import { GuideViewComponent } from './guide-view/guide-view.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RoadmapComponent, ProjectListComponent, GuideViewComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Project Roadmap';
  currentView: 'dashboard' | 'list' | 'guide' = 'dashboard';

  setView(view: 'dashboard' | 'list' | 'guide'): void {
    this.currentView = view;
  }
}