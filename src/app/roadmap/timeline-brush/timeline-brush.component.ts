import { Component, EventEmitter, Input, Output, signal, computed, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-timeline-brush',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './timeline-brush.component.html',
    styleUrl: './timeline-brush.component.css'
})
export class TimelineBrushComponent implements OnChanges {
    @Input() globalStartDate!: Date;
    @Input() globalEndDate!: Date;
    @Input() activeStartDate!: Date;
    @Input() activeEndDate!: Date;

    @Output() rangeChange = new EventEmitter<{ start: Date, end: Date }>();

    @ViewChild('track', { static: true }) trackRef!: ElementRef<HTMLDivElement>;

    // Internal state for drag/resize
    private isDragging = false;
    private isResizingLeft = false;
    private isResizingRight = false;
    private dragStartX = 0;
    private initialLeft = 0;
    private initialWidth = 0;

    // Computed positions (percentages)
    leftPercent = signal(0);
    widthPercent = signal(100);

    constructor() { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['globalStartDate'] || changes['globalEndDate'] || changes['activeStartDate'] || changes['activeEndDate']) {
            this.updateVisualsFromInputs();
        }
    }

    private updateVisualsFromInputs(): void {
        if (!this.globalStartDate || !this.globalEndDate || !this.activeStartDate || !this.activeEndDate) return;

        const totalTime = this.globalEndDate.getTime() - this.globalStartDate.getTime();
        if (totalTime <= 0) return;

        const startOffset = this.activeStartDate.getTime() - this.globalStartDate.getTime();
        const duration = this.activeEndDate.getTime() - this.activeStartDate.getTime();

        this.leftPercent.set((startOffset / totalTime) * 100);
        this.widthPercent.set((duration / totalTime) * 100);
    }

    onMouseDownHandle(event: MouseEvent, type: 'left' | 'right'): void {
        event.stopPropagation();
        event.preventDefault();

        if (type === 'left') this.isResizingLeft = true;
        if (type === 'right') this.isResizingRight = true;

        this.startDrag(event);
    }

    onMouseDownSelection(event: MouseEvent): void {
        event.stopPropagation();
        event.preventDefault();
        this.isDragging = true;
        this.startDrag(event);
    }

    private startDrag(event: MouseEvent): void {
        this.dragStartX = event.clientX;
        this.initialLeft = this.leftPercent();
        this.initialWidth = this.widthPercent();

        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
    }

    private onMouseMove = (event: MouseEvent) => {
        if (!this.trackRef) return;

        const trackWidth = this.trackRef.nativeElement.getBoundingClientRect().width;
        const deltaX = event.clientX - this.dragStartX;
        const deltaPercent = (deltaX / trackWidth) * 100;

        let newLeft = this.initialLeft;
        let newWidth = this.initialWidth;

        if (this.isDragging) {
            newLeft = Math.max(0, Math.min(100 - newWidth, this.initialLeft + deltaPercent));
        } else if (this.isResizingLeft) {
            // Moves left edge: changes left and width
            // Max left is current right edge (initialLeft + initialWidth)
            // Min width is e.g. 1%
            const maxLeft = this.initialLeft + this.initialWidth - 1;
            newLeft = Math.min(maxLeft, Math.max(0, this.initialLeft + deltaPercent));
            newWidth = (this.initialLeft + this.initialWidth) - newLeft;
        } else if (this.isResizingRight) {
            // Moves right edge: changes width only
            newWidth = Math.max(1, Math.min(100 - newLeft, this.initialWidth + deltaPercent));
        }

        this.leftPercent.set(newLeft);
        this.widthPercent.set(newWidth);

        this.emitRangeChange();
    }

    private onMouseUp = () => {
        this.isDragging = false;
        this.isResizingLeft = false;
        this.isResizingRight = false;
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
    }

    private emitRangeChange(): void {
        if (!this.globalStartDate || !this.globalEndDate) return;

        const totalTime = this.globalEndDate.getTime() - this.globalStartDate.getTime();

        // Calculate new Dates from percentages
        const startMs = this.globalStartDate.getTime() + (totalTime * (this.leftPercent() / 100));
        const endMs = startMs + (totalTime * (this.widthPercent() / 100));

        this.rangeChange.emit({
            start: new Date(startMs),
            end: new Date(endMs)
        });
    }
}
