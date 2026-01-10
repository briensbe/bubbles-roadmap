import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectBubble } from '../models/project.model';
import { RoadmapService } from '../roadmap.service';
import {
    LucideAngularModule,
    FileSpreadsheet,
    FileUp,
    X,
    CheckCircle,
    AlertCircle,
    Save,
    Loader2
} from 'lucide-angular';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-project-excel-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './project-excel-modal.component.html',
    styleUrl: './project-excel-modal.component.css'
})
export class ProjectExcelModalComponent {
    @Input({ required: true }) projects!: ProjectBubble[];
    @Output() close = new EventEmitter<void>();

    roadmapService = inject(RoadmapService);

    errorMessage: string | null = null;
    successMessage: string | null = null;
    importedProjects: ProjectBubble[] | null = null;
    isProcessing: boolean = false;

    // Icons
    readonly FileSpreadsheet = FileSpreadsheet;
    readonly FileUp = FileUp;
    readonly X = X;
    readonly CheckCircle = CheckCircle;
    readonly AlertCircle = AlertCircle;
    readonly Save = Save;
    readonly Loader2 = Loader2;

    exportToExcel(): void {
        try {
            const dataToExport = this.projects.map(p => ({
                'ID': p.id,
                'Project Key': p.projectKey || '',
                'Name': p.name,
                'Service': p.service,
                'Complexity': p.complexity,
                'Value': p.value,
                'Start Date': p.startDate instanceof Date ? p.startDate.toLocaleDateString() : p.startDate
            }));

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');

            XLSX.writeFile(workbook, 'roadmap_projects.xlsx');

            this.successMessage = 'Excel file exported successfully!';
            setTimeout(() => this.successMessage = null, 3000);
        } catch (error) {
            console.error('Export failed', error);
            this.errorMessage = 'Failed to export Excel file.';
        }
    }

    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e: any) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

                if (jsonData.length === 0) {
                    throw new Error('The Excel file is empty.');
                }

                // Check for required headers in the first row
                const firstRow = jsonData[0];
                const requiredColumns = ['ID', 'Name', 'Service', 'Complexity', 'Value', 'Start Date'];
                const missingColumns = requiredColumns.filter(col => !(col in firstRow));

                if (missingColumns.length > 0) {
                    throw new Error(`Missing required columns in Excel: ${missingColumns.join(', ')}. Please ensure the first row contains these exact headers.`);
                }

                this.importedProjects = jsonData.map((row: any): ProjectBubble => {
                    // Try to parse the date
                    let rawDate = row['Start Date'];

                    let startDate: Date;
                    if (rawDate instanceof Date) {
                        startDate = rawDate;
                    } else if (typeof rawDate === 'number') {
                        // This shouldn't happen much with cellDates: true, but just in case
                        startDate = XLSX.utils.format_cell({ v: rawDate, t: 'd' }) as any;
                        if (!(startDate instanceof Date)) startDate = new Date(rawDate);
                    } else {
                        // try to parse string or other formats
                        const parsed = this.parseDate(rawDate);
                        startDate = parsed instanceof Date ? parsed : new Date(rawDate);
                    }

                    const project: ProjectBubble = {
                        id: Number(row['ID']),
                        projectKey: row['Project Key'] ? String(row['Project Key']) : undefined,
                        name: String(row['Name']),
                        service: String(row['Service']),
                        complexity: Number(row['Complexity']),
                        value: Number(row['Value']),
                        startDate: startDate
                    };

                    return project;
                });

                // Validation
                this.checkData();

                this.checkIDUnicity(this.importedProjects);

                this.successMessage = 'Excel data loaded! Click "Update Projects" to save.';
            } catch (err: any) {
                this.errorMessage = 'Failed to parse Excel: ' + err.message;
                this.importedProjects = null;
                console.error('Excel parse error', err);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    // fonction pour parser la date dd/mm/yyyy poru éviter une erreur de format
    private parseDate(value: any): Date | null {
        if (value instanceof Date) return value; // Déjà une date grâce à cellDates: true

        if (typeof value === 'string') {
            const [d, m, y] = value.split('/').map(Number);
            return new Date(y, m - 1, d);
        }
        return null;
    }

    private checkData() {
        if (!this.importedProjects) return;

        this.importedProjects.forEach((p, index) => {
            const rowNum = index + 1;
            const prefix = `Project at row ${rowNum} (ID: ${p.id || 'N/A'}): `;

            if (isNaN(p.id)) throw new Error(`${prefix}ID must be a number.`);
            if (!p.name || p.name.trim() === '') throw new Error(`${prefix}Name is required.`);
            if (!p.service || p.service.trim() === '') {
                throw new Error(`${prefix}Service is required.`);
            }
            if (isNaN(p.complexity)) throw new Error(`${prefix}Complexity must be a number.`);
            if (isNaN(p.value)) throw new Error(`${prefix}Value must be a number.`);
            if (isNaN(p.startDate.getTime())) throw new Error(`${prefix}Start Date is invalid or missing.`);
        });
    }

    async saveChanges(): Promise<void> {
        if (!this.importedProjects) return;

        this.isProcessing = true;

        // Artificial delay to show the loader
        await new Promise(resolve => setTimeout(resolve, 1000));

        this.roadmapService.replaceProjects(this.importedProjects);
        this.successMessage = 'Projects imported successfully!';
        this.isProcessing = false;

        setTimeout(() => {
            this.successMessage = null;
            this.close.emit();
        }, 1500);
    }

    private checkIDUnicity(projects: any[]) {
        const ids = projects.map(p => p.id);
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
        if (this.importedProjects && !confirm('You have unsaved imported projects. Are you sure you want to close? Your changes will be lost.')) {
            return;
        }
        this.close.emit();
    }
}
