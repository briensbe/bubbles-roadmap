import { Component, EventEmitter, Input, Output, signal, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-value-brush',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './value-brush.component.html',
    styleUrl: './value-brush.component.css'
})
export class ValueBrushComponent implements OnChanges {
    @Input() min = 0;
    @Input() max = 650;
    @Input() activeMin = 0;
    @Input() activeMax = 650;

    @Output() rangeChange = new EventEmitter<{ min: number, max: number }>();

    @ViewChild('track', { static: true }) trackRef!: ElementRef<HTMLDivElement>;

    // Internal state for drag/resize
    private isDragging = false;
    private isResizingTop = false;
    private isResizingBottom = false;
    private dragStartY = 0;
    private initialBottom = 0;
    private initialHeight = 0;

    // Computed positions (percentages)
    bottomPercent = signal(0);
    heightPercent = signal(100);

    constructor() { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['min'] || changes['max'] || changes['activeMin'] || changes['activeMax']) {
            this.updateVisualsFromInputs();
        }
    }

    private updateVisualsFromInputs(): void {
        const total = this.max - this.min;
        if (total <= 0) return;

        const bottomOffset = this.activeMin - this.min;
        const height = this.activeMax - this.activeMin;

        this.bottomPercent.set((bottomOffset / total) * 100);
        this.heightPercent.set((height / total) * 100);
    }

    onMouseDownHandle(event: MouseEvent, type: 'top' | 'bottom'): void {
        event.stopPropagation();
        event.preventDefault();

        if (type === 'top') this.isResizingTop = true;
        if (type === 'bottom') this.isResizingBottom = true;

        this.startDrag(event);
    }

    onMouseDownSelection(event: MouseEvent): void {
        event.stopPropagation();
        event.preventDefault();
        this.isDragging = true;
        this.startDrag(event);
    }

    private startDrag(event: MouseEvent): void {
        this.dragStartY = event.clientY;
        this.initialBottom = this.bottomPercent();
        this.initialHeight = this.heightPercent();

        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
    }

    private onMouseMove = (event: MouseEvent) => {
        if (!this.trackRef) return;

        const trackHeight = this.trackRef.nativeElement.getBoundingClientRect().height;
        // In browser, Y increases downwards. We want bottom position, so deltaY is inverted for bottom%
        const deltaY = this.dragStartY - event.clientY;
        const deltaPercent = (deltaY / trackHeight) * 100;

        let newBottom = this.initialBottom;
        let newHeight = this.initialHeight;

        if (this.isDragging) {
            newBottom = Math.max(0, Math.min(100 - newHeight, this.initialBottom + deltaPercent));
        } else if (this.isResizingBottom) {
            // Moves bottom edge: changes bottom and height
            const maxBottom = this.initialBottom + this.initialHeight - 1;
            newBottom = Math.min(maxBottom, Math.max(0, this.initialBottom + deltaPercent));
            newHeight = (this.initialBottom + this.initialHeight) - newBottom;
        } else if (this.isResizingTop) {
            // Moves top edge: changes height only
            newHeight = Math.max(1, Math.min(100 - newBottom, this.initialHeight + deltaPercent));
        }

        this.bottomPercent.set(newBottom);
        this.heightPercent.set(newHeight);

        this.emitRangeChange();
    }

    private onMouseUp = () => {
        this.isDragging = false;
        this.isResizingTop = false;
        this.isResizingBottom = false;
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
    }

    private emitRangeChange(): void {
        const total = this.max - this.min;

        const bottomVal = this.min + (total * (this.bottomPercent() / 100));
        const topVal = bottomVal + (total * (this.heightPercent() / 100));

        this.rangeChange.emit({
            min: Math.round(bottomVal),
            max: Math.round(topVal)
        });
    }
}
