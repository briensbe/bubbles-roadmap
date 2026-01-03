import { Component, Input, OnInit, inject, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragEnd, DragDropModule } from '@angular/cdk/drag-drop';
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
  @Input() lockXAxis: boolean = false;

  // Inputs for initial positioning (handled by parent component)
  @Input({ required: true }) initialX!: number;
  @Input({ required: true }) initialY!: number;

  @Output() edit = new EventEmitter<ProjectBubble>();
  @Output() positionChange = new EventEmitter<{ project: ProjectBubble, newX: number, newY: number }>();
  @Output() complexityChange = new EventEmitter<{ project: ProjectBubble, newComplexity: number }>();
  @Output() hovered = new EventEmitter<void>();

  roadmapService = inject(RoadmapService);

  size: number = 0;
  serviceColorClass: string = '';

  // Resize tracking
  isResizing: boolean = false;
  resizeStartSize: number = 0;
  resizeStartX: number = 0;
  resizeStartY: number = 0;

  // Configuration for size scaling (0-50 complexity maps to 40px - 120px diameter)
  readonly MIN_SIZE = 30;
  readonly MAX_SIZE = 200;
  private COMPLEXITY_RANGE = 500;

  get axisLock(): any {
    return this.lockXAxis ? 'y' : undefined;
  }

  ngOnInit(): void {
    this.calculateSize();
    this.serviceColorClass = this.roadmapService.getServiceColor(this.project.service);
  }

  ngOnChanges(): void {
    // Recalculate size if project input changes (e.g., after modal edit)
    this.calculateSize();
    this.serviceColorClass = this.roadmapService.getServiceColor(this.project.service);
  }

  calculateSize(): void {
    // Linear scaling: size = MIN + (Complexity / COMPLEXITY_RANGE) * (MAX - MIN)
    this.size = this.MIN_SIZE + (this.project.complexity / this.COMPLEXITY_RANGE) * (this.MAX_SIZE - this.MIN_SIZE);
  }

  // Method to calculate complexity from size
  calculateComplexity(size: number): number {
    // Inverse scaling: Complexity = ((Size - MIN) / (MAX - MIN)) * COMPLEXITY_RANGE
    const clampedSize = Math.max(this.MIN_SIZE, Math.min(this.MAX_SIZE, size));
    const normalizedSize = (clampedSize - this.MIN_SIZE) / (this.MAX_SIZE - this.MIN_SIZE);
    return Math.round(normalizedSize * this.COMPLEXITY_RANGE);
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

    // Reset the drag position visually after emitting the change
    event.source.reset();
  }

  onResizeStart(event: MouseEvent): void {
    this.isResizing = true;
    this.resizeStartSize = this.size;
    this.resizeStartX = event.clientX;
    this.resizeStartY = event.clientY;
    event.stopPropagation();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isResizing) return;

    const deltaX = event.clientX - this.resizeStartX;
    const deltaY = event.clientY - this.resizeStartY;
    const delta = Math.max(deltaX, deltaY);

    let newSize = this.resizeStartSize + delta * 2;
    newSize = Math.max(this.MIN_SIZE, Math.min(this.MAX_SIZE, newSize));

    this.size = newSize;
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    if (!this.isResizing) return;

    this.isResizing = false;
    const newComplexity = this.calculateComplexity(this.size);

    this.complexityChange.emit({
      project: this.project,
      newComplexity: newComplexity
    });
  }

  onBubbleClick(event: MouseEvent): void {
    // Prevent click event from firing immediately after drag end (detail is 0 for synthetic clicks)
    if (event.detail === 0) return;
    this.edit.emit(this.project);
  }

  onMouseEnter(): void {
    this.hovered.emit();
  }
}