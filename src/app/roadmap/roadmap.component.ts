import { Component, inject, OnInit, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoadmapService } from '../roadmap.service';
import { ProjectBubbleComponent } from '../project-bubble/project-bubble.component';
import { ProjectBubble } from '../models/project.model';
import { ProjectEditModalComponent } from '../project-edit-modal/project-edit-modal.component';
import { ROADMAP_CONFIG } from '../models/project.constants';
import { LucideAngularModule, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { TimelineBrushComponent } from './timeline-brush/timeline-brush.component';

@Component({
  selector: 'app-roadmap',
  standalone: true,
  imports: [CommonModule, ProjectBubbleComponent, ProjectEditModalComponent, TimelineBrushComponent, LucideAngularModule, FormsModule],
  templateUrl: './roadmap.component.html',
  styleUrl: './roadmap.component.css'
})
export class RoadmapComponent implements OnInit {
  @ViewChild('gridContainer') gridContainer!: ElementRef<HTMLDivElement>;

  // Icons
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly Plus = Plus;
  readonly Search = Search;
  readonly Math = Math;

  roadmapService = inject(RoadmapService);
  projects = this.roadmapService.projects;

  // Expose configuration to template
  readonly CONFIG = ROADMAP_CONFIG;

  // --- TIME & ZOOM STATE ---
  focusedYear = signal(2026);

  globalStartDate = computed(() => new Date(this.focusedYear(), 0, 1));
  globalEndDate = computed(() => new Date(this.focusedYear(), 11, 31));

  viewStartDate = signal<Date>(new Date(2026, 0, 1));
  viewEndDate = signal<Date>(new Date(2026, 3, 30)); // April 30th (4 months)

  viewDurationMs = computed(() => this.viewEndDate().getTime() - this.viewStartDate().getTime());

  viewDurationMonths = computed(() => {
    const start = this.viewStartDate();
    const end = this.viewEndDate();
    return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + (end.getDate() - start.getDate()) / 30;
  });

  get timelineMonths(): { name: string, year: number, leftPercent: number }[] {
    const months = [];
    const viewStart = this.viewStartDate();
    const viewEnd = this.viewEndDate();
    const viewDuration = this.viewDurationMs();

    let currentIter = new Date(viewStart.getFullYear(), viewStart.getMonth(), 1);

    let limit = 0;
    while (currentIter < viewEnd && limit < 100) {
      if (currentIter >= viewStart || new Date(currentIter.getFullYear(), currentIter.getMonth() + 1, 0) > viewStart) {
        const positionMs = currentIter.getTime() - viewStart.getTime();
        const leftPercent = (positionMs / viewDuration) * 100;

        if (leftPercent < 100) {
          months.push({
            name: currentIter.toLocaleString('default', { month: 'short' }),
            year: currentIter.getFullYear(),
            leftPercent: Math.max(0, leftPercent)
          });
        }
      }
      currentIter = new Date(currentIter.getFullYear(), currentIter.getMonth() + 1, 1);
      limit++;
    }
    return months;
  }

  // --- /TIME & ZOOM STATE ---

  activeComplexityFilters = signal<Set<string>>(new Set(['XS', 'S', 'M', 'L', 'XL']));
  activeServiceFilters = signal<Set<string>>(new Set());

  visibleProjects = computed(() => {
    const projects = this.projects();
    const start = this.viewStartDate();
    const end = this.viewEndDate();

    return projects.filter(p => {
      const pDate = new Date(p.startDate);
      const inView = pDate >= start && pDate <= end;

      const bufferMs = 30 * 24 * 60 * 60 * 1000;
      const extendedStart = new Date(start.getTime() - bufferMs);
      const extendedEnd = new Date(end.getTime() + bufferMs);
      const isRelevant = pDate >= extendedStart && pDate <= extendedEnd;

      const search = this.searchText().toLowerCase();
      const searchMatch = !search ||
        p.name.toLowerCase().includes(search) ||
        p.projectKey?.toLowerCase().includes(search);

      const complexityLabel = this.getComplexityLabel(p.complexity);
      const complexityMatch = this.activeComplexityFilters().has(complexityLabel);

      const serviceMatch = this.activeServiceFilters().has(p.service);

      return isRelevant && searchMatch && complexityMatch && serviceMatch;
    });
  });

  filteredProjectCount = computed(() => this.visibleProjects().length);

  currentYear = computed(() => {
    const centerMs = this.viewStartDate().getTime() + this.viewDurationMs() / 2;
    return new Date(centerMs).getFullYear();
  });

  navigationYears = computed(() => {
    // Current year is based on the VIEW center, not necessarily the focused "Global" year.
    // However, usually they align.
    const current = this.currentYear();
    return [current - 1, current, current + 1];
  });

  getProjectCount(year: number): number {
    return this.projects().filter(p => new Date(p.startDate).getFullYear() === year).length;
  }

  jumpToYear(targetYear: number): void {
    // 1. Update the focused year so the global timeline (brush) shifts context
    this.focusedYear.set(targetYear);

    // 2. Shift the CURRENT VIEW range to the new year, maintaining month/day offsets
    const currentStart = this.viewStartDate();
    const currentEnd = this.viewEndDate();

    // Calculate the year difference
    // Actually simpler: just creating new dates with the target year
    // Note: This logic assumes we want to jump to the SAME dates in the new year.
    // e.g. Feb 1 2026 -> Feb 1 2027.

    const newStart = new Date(currentStart);
    newStart.setFullYear(targetYear);

    const newEnd = new Date(currentEnd);
    newEnd.setFullYear(targetYear);

    // Check for leap year edge cases? e.g. Feb 29. 
    // setFullYear(2027) on Feb 29 2024 -> Mar 1 2027. This is acceptable default JS behavior.

    this.viewStartDate.set(newStart);
    this.viewEndDate.set(newEnd);
  }

  navigate(months: number): void {
    const currentStart = this.viewStartDate();
    const currentEnd = this.viewEndDate();

    const newStart = new Date(currentStart.setMonth(currentStart.getMonth() + months));
    const newEnd = new Date(currentEnd.setMonth(currentEnd.getMonth() + months));

    this.viewStartDate.set(newStart);
    this.viewEndDate.set(newEnd);

    // 1. Update the focused year so the global timeline (brush) shifts context
    this.focusedYear.set(newStart.getFullYear());

  }

  handleRangeChange(range: { start: Date, end: Date }): void {
    const minDuration = 1000 * 60 * 60 * 24 * 15;
    if (range.end.getTime() - range.start.getTime() < minDuration) return;

    this.viewStartDate.set(range.start);
    this.viewEndDate.set(range.end);
  }

  activeProject = signal<ProjectBubble | null>(null);
  editingProject = signal<ProjectBubble | null>(null);
  isXAxisLocked = signal<boolean>(false);
  showLabelsOnHoverOnly = signal<boolean>(true);
  searchText = signal<string>('');
  topmostProjectId = signal<number | null>(null);

  get yAxisTicks(): number[] {
    const ticks = [];
    const step = 100;
    for (let i = 0; i <= this.CONFIG.VALUE_RANGE; i += step) {
      ticks.push(i);
    }
    return ticks;
  }

  private GRID_HEIGHT = 600;

  visibleServiceCount = signal<number>(3);
  visibleServices = computed(() => this.roadmapService.distinctServices().slice(0, this.visibleServiceCount()));

  showMoreServices(): void {
    this.visibleServiceCount.update(count => count + 3);
  }

  toggleComplexityFilter(label: string): void {
    this.activeComplexityFilters.update(filters => {
      const newFilters = new Set(filters);
      if (newFilters.has(label)) {
        newFilters.delete(label);
      } else {
        newFilters.add(label);
      }
      return newFilters;
    });
  }

  toggleServiceFilter(service: string): void {
    this.activeServiceFilters.update(filters => {
      const newFilters = new Set(filters);
      if (newFilters.has(service)) {
        newFilters.delete(service);
      } else {
        newFilters.add(service);
      }
      return newFilters;
    });
  }

  clearAllFilters(): void {
    this.activeComplexityFilters.set(new Set(['XS', 'S', 'M', 'L', 'XL']));
    this.activeServiceFilters.set(new Set(this.roadmapService.distinctServices()));
  }

  selectAllFilters(): void {
    this.activeComplexityFilters.set(new Set(['XS', 'S', 'M', 'L', 'XL']));
    this.activeServiceFilters.set(new Set(this.roadmapService.distinctServices()));
  }

  getComplexityLabel(complexity: number): string {
    if (complexity <= 50) return 'XS';
    if (complexity <= 100) return 'S';
    if (complexity <= 250) return 'M';
    if (complexity <= 400) return 'L';
    return 'XL';
  }

  isComplexityFilterActive(label: string): boolean {
    return this.activeComplexityFilters().has(label);
  }

  isServiceFilterActive(service: string): boolean {
    return this.activeServiceFilters().has(service);
  }

  complexityLegend = [
    { label: 'XS', size: 50, description: 'very simple', range: [0, 50] },
    { label: 'S', size: 100, description: 'simple', range: [50, 100] },
    { label: 'M', size: 250, description: 'medium', range: [100, 250] },
    { label: 'L', size: 400, description: 'complex', range: [250, 400] },
    { label: 'XL', size: 500, description: 'very complex', range: [400, 500] }
  ];

  getLegendBubbleSize(complexity: number): number {
    const minSize = 20;
    const maxSize = 80;
    const ratio = complexity / this.CONFIG.MAX_COMPLEXITY;
    return minSize + ratio * (maxSize - minSize);
  }

  ngOnInit(): void {
    this.activeServiceFilters.set(new Set(this.roadmapService.distinctServices()));
  }

  calculateXPositionPercentage(date: Date): number {
    const startMs = new Date(date).getTime();
    const viewStartMs = this.viewStartDate().getTime();
    const viewDurationMs = this.viewDurationMs();

    const percentage = ((startMs - viewStartMs) / viewDurationMs) * 100;
    return percentage;
  }

  calculateXPosition(date: Date): number {
    return this.calculateXPositionPercentage(date);
  }

  calculateYPosition(value: number): number {
    const normalizedValue = Math.min(value, this.CONFIG.VALUE_RANGE) / this.CONFIG.VALUE_RANGE;
    return normalizedValue * this.GRID_HEIGHT;
  }

  openEditModal(project: ProjectBubble): void {
    this.editingProject.set(project);
    this.activeProject.set(project);
  }

  openAddModal(): void {
    const newProject: ProjectBubble = {
      id: 0,
      name: 'Nouveau projet',
      service: 'IT',
      complexity: 100,
      value: 100,
      startDate: new Date(this.viewStartDate())
    };
    this.editingProject.set(newProject);
  }

  closeEditModal(): void {
    this.editingProject.set(null);
  }

  selectProject(project: ProjectBubble): void {
    this.activeProject.set(project);
  }

  deselectProject(): void {
    this.activeProject.set(null);
  }

  handlePositionChange(event: { project: ProjectBubble, newX: number, newY: number, newXPercent?: number }): void {
    const { project, newX, newY, newXPercent } = event;

    const normalizedValue = Math.max(0, Math.min(newY, this.GRID_HEIGHT)) / this.GRID_HEIGHT;
    const calculatedValue = Math.round(normalizedValue * this.CONFIG.VALUE_RANGE);
    const newValue = Math.min(this.CONFIG.MAX_BUSINESS_VALUE, calculatedValue);

    let normalizedTime: number;

    if (newXPercent !== undefined) {
      // PREFERRED: Use the percentage calculated by the bubble context
      normalizedTime = newXPercent / 100;
    } else {
      // FALLBACK: Use local grid container width
      const containerWidth = this.gridContainer ? this.gridContainer.nativeElement.offsetWidth : 1000;
      normalizedTime = Math.max(0, Math.min(newX, containerWidth)) / containerWidth;
    }

    const viewDurationMs = this.viewDurationMs();
    const timeOffsetMs = normalizedTime * viewDurationMs;

    const newStartMs = this.viewStartDate().getTime() + timeOffsetMs;
    const targetDate = new Date(newStartMs);
    targetDate.setHours(0, 0, 0, 0);

    const newStartDate = this.isXAxisLocked()
      ? project.startDate
      : targetDate;

    const updatedProject: ProjectBubble = {
      ...project,
      value: newValue,
      startDate: newStartDate,
    };

    this.roadmapService.updateProject(updatedProject);
    this.activeProject.set(updatedProject);
  }

  handleComplexityChange(event: { project: ProjectBubble, newComplexity: number }): void {
    const { project, newComplexity } = event;

    const updatedProject: ProjectBubble = {
      ...project,
      complexity: newComplexity,
    };

    this.roadmapService.updateProject(updatedProject);
    this.activeProject.set(updatedProject);
  }
}