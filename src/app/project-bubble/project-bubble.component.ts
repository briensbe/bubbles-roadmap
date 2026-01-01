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
  @Output() positionChange = new EventEmitter<{ project: ProjectBubble, newX: number, newY: number }>();

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
    // Get the current position relative to the starting point
    const dragOffset = event.distance;
    
    // Calculate the new center position in pixels relative to the grid origin (bottom-left)
    const newX = this.initialX + dragOffset.x;
    const newY = this.initialY - dragOffset.y; // Y is inverted for CSS bottom property
    
    this.positionChange.emit({
      project: this.project,
      newX: newX,
      newY: newY
    });
    
    // Do NOT reset the drag position here. We let the parent component handle the update
    // and Angular re-render the component at the new calculated position.
    // event.source.reset(); // Removing reset to allow visual drag until data update
  }
  
  onBubbleClick(event: MouseEvent): void {
    // Prevent click event from firing immediately after drag end (detail is 0 for synthetic clicks)
    if (event.detail === 0) return; 
    this.edit.emit(this.project);
  }
}