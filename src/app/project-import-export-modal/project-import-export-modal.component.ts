import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectBubble } from '../models/project.model';
import { RoadmapService } from '../roadmap.service';
import {
    LucideAngularModule,
    Copy,
    Save,
    X,
    CheckCircle,
    AlertCircle
} from 'lucide-angular';

@Component({
    selector: 'app-project-import-export-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './project-import-export-modal.component.html',
    styleUrl: './project-import-export-modal.component.css'
})
export class ProjectImportExportModalComponent implements OnInit {
    @Input({ required: true }) projects!: ProjectBubble[];
    @Output() close = new EventEmitter<void>();

    roadmapService = inject(RoadmapService);

    jsonContent: string = '';
    errorMessage: string | null = null;
    successMessage: string | null = null;

    // Icons
    readonly Copy = Copy;
    readonly Save = Save;
    readonly X = X;
    readonly CheckCircle = CheckCircle;
    readonly AlertCircle = AlertCircle;

    ngOnInit(): void {
        // Stringify current projects with pretty printing
        this.jsonContent = JSON.stringify(this.projects, null, 2);
    }

    copyToClipboard(): void {
        navigator.clipboard.writeText(this.jsonContent).then(() => {
            this.successMessage = 'JSON copied to clipboard!';
            setTimeout(() => this.successMessage = null, 3000);
        }).catch(err => {
            this.errorMessage = 'Failed to copy to clipboard.';
            console.error('Copy failed', err);
        });
    }

    saveChanges(): void {
        this.errorMessage = null;
        try {
            const parsedData = JSON.parse(this.jsonContent);

            if (!Array.isArray(parsedData)) {
                throw new Error('JSON mush be an array of projects.');
            }

            // Basic structure validation
            const isValid = parsedData.every(p =>
                typeof p.id === 'number' &&
                typeof p.name === 'string' &&
                ['Finance', 'Marketing', 'IT', 'HR'].includes(p.service) &&
                typeof p.complexity === 'number' &&
                typeof p.value === 'number' &&
                p.startDate !== undefined
            );

            if (!isValid) {
                throw new Error('Invalid project structure. Please check the fields (id, name, service, complexity, value, startDate).');
            }

            // Check for ID uniqueness
            const ids = parsedData.map(p => p.id);
            const hasDuplicates = ids.some((id, index) => ids.indexOf(id) !== index);
            if (hasDuplicates) {
                throw new Error('Duplicate project IDs found. Each project must have a unique ID.');
            }

            this.roadmapService.replaceProjects(parsedData);
            this.successMessage = 'Projects imported successfully!';
            setTimeout(() => {
                this.successMessage = null;
                this.close.emit();
            }, 1500);
        } catch (e: any) {
            this.errorMessage = 'Invalid JSON: ' + e.message;
        }
    }

    cancel(): void {
        this.close.emit();
    }
}
