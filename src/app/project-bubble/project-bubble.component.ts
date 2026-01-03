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
  @Input() isSelected: boolean = false;
  @Input() lockXAxis: boolean = false;

  // Inputs for initial positioning (handled by parent component)
  @Input({ required: true }) initialX!: number;
  @Input({ required: true }) initialY!: number;

  @Output() edit = new EventEmitter<ProjectBubble>();
  @Output() clickSelection = new EventEmitter<ProjectBubble>();
  @Output() positionChange = new EventEmitter<{ project: ProjectBubble, newX: number, newY: number }>();
  @Output() complexityChange = new EventEmitter<{ project: ProjectBubble, newComplexity: number }>();
  @Output() hovered = new EventEmitter<void>();

  roadmapService = inject(RoadmapService);

  size: number = 0;
  serviceColorClass: string = '';

  // Resize tracking
  isResizing: boolean = false;
  private bubbleCenterX: number = 0;
  private bubbleCenterY: number = 0;

  // Configuration for size scaling (0-500 complexity maps to 40px - 120px diameter)
  readonly MIN_SIZE = 30;
  readonly MAX_SIZE = 200;
  readonly COMPLEXITY_RANGE = 500;

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

    // Get the bounding rect of the host element (which is the center point)
    // or calculate from the bubble container rect.
    const container = (event.target as HTMLElement).parentElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      this.bubbleCenterX = rect.left + rect.width / 2;
      this.bubbleCenterY = rect.top + rect.height / 2;
    }

    event.stopPropagation();
    event.preventDefault(); // Prevent text selection
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isResizing) return;

    // Distance from mouse to center
    const dx = event.clientX - this.bubbleCenterX;
    const dy = event.clientY - this.bubbleCenterY;

    // In a symmetric resize from center, the new diameter is 2 * distance to edge
    // We use the maximum of dx and dy distance to allow diagonal-ish dragging
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Since we want the bubble to be a circle, and the mouse is at the edge (the handle),
    // the distance represents the radius.
    // However, to keep it feeling "natural" with corner handles, we use a 1.414 (sqrt2) factor
    // if we wanted it to follow the corner exactly, but here let's just use the radius * 2.
    // Actually, simple radius * 2 is the most mathematically correct for "distance from center".
    let newSize = distance * 2;

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

  onSingleClick(event: MouseEvent): void {
    if (event.detail === 0) return;
    event.stopPropagation();
    this.clickSelection.emit(this.project);
  }

  onMouseEnter(): void {
    this.hovered.emit();
  }
}