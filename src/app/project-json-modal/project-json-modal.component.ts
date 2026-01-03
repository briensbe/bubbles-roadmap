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
    selector: 'app-project-json-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './project-json-modal.component.html',
    styleUrl: './project-json-modal.component.css'
})
export class ProjectJsonModalComponent implements OnInit {
    @Input({ required: true }) projects!: ProjectBubble[];
    @Output() close = new EventEmitter<void>();

    roadmapService = inject(RoadmapService);

    jsonContent: string = '';
    initialJsonContent: string = '';
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
        this.initialJsonContent = this.jsonContent;
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
            this.checkData(parsedData);

            // Check for ID uniqueness
            this.checkIDUnicity(parsedData);


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

    private checkData(parsedData: any[]): void {
        parsedData.forEach((p, index) => {
            const prefix = `Project at index ${index} (ID: ${p.id || 'N/A'}): `;
            if (typeof p.id !== 'number') throw new Error(`${prefix}Field "id" must be a number.`);
            if (typeof p.name !== 'string') throw new Error(`${prefix}Field "name" must be a string.`);
            if (!['Finance', 'Marketing', 'IT', 'HR'].includes(p.service)) {
                throw new Error(`${prefix}Field "service" must be one of: Finance, Marketing, IT, HR.`);
            }

            if (typeof p.complexity !== 'number') throw new Error(`${prefix}Field "complexity" must be a number.`);
            if (typeof p.value !== 'number') throw new Error(`${prefix}Field "value" must be a number.`);
            if (p.startDate === undefined) throw new Error(`${prefix}Field "startDate" is required.`);
        });
    }

    private checkIDUnicity(parsedData: any[]) {
        const ids = parsedData.map(p => p.id);

        const seen = new Set();
        const duplicates = new Set();

        for (const id of ids) {
            if (seen.has(id)) {
                duplicates.add(id);
            } else {
                seen.add(id);
            }
        }

        if (duplicates.size > 0) {
            throw new Error(`Duplicate project IDs found: ${Array.from(duplicates).join(', ')}`);
        }
    }

    cancel(): void {
        if (this.jsonContent !== this.initialJsonContent && !confirm('You have unsaved changes in the JSON data. Are you sure you want to close?')) {
            return;
        }
        this.close.emit();
    }
}
