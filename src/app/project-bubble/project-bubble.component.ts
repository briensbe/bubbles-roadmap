import { Component, Input, OnInit, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDragEnd, DragDropModule } from '@angular/cdk/drag-drop';
import { ProjectBubble } from '../models/project.model';
import { RoadmapService } from '../roadmap.service';

@Component({
  selector: 'app-project-bubble',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './project-bubble.component.html',
  styleUrl: './project-bubble.component.css'
})
export class ProjectBubbleComponent implements OnInit {
  @Input({ required: true }) project!: ProjectBubble;
  
  // Inputs for initial positioning (handled by parent component)
  @Input({ required: true }) initialX!: number;
  @Input({ required: true }) initialY!: number;
  
  @Output() edit = new EventEmitter<ProjectBubble>();

  roadmapService = inject(RoadmapService);

  size: number = 0;
  serviceColorClass: string = '';

  // Configuration for size scaling (0-50 complexity maps to 40px - 120px diameter)
  private MIN_SIZE = 40;
  private MAX_SIZE = 120;
  private COMPLEXITY_RANGE = 50;

  ngOnInit(): void {
    this.calculateSize();
    this.serviceColorClass = this.roadmapService.getServiceColor(this.project.service);
  }

  calculateSize(): void {
    // Linear scaling: size = MIN + (Complexity / COMPLEXITY_RANGE) * (MAX - MIN)
    this.size = this.MIN_SIZE + (this.project.complexity / this.COMPLEXITY_RANGE) * (this.MAX_SIZE - this.MIN_SIZE);
  }

  onDragEnd(event: CdkDragEnd): void {
    // We reset the drag position to zero so that the next render uses the calculated initialX/Y
    // Manual dragging is purely visual in this implementation unless persistence is requested.
    event.source.reset();
    
    console.log(`Project ${this.project.name} dragged.`);
  }
  
  onBubbleClick(): void {
    this.edit.emit(this.project);
  }
}