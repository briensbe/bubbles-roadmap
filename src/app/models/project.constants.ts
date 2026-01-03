import { ProjectBubble } from './project.model';

export const ROADMAP_CONFIG = {
    MAX_BUSINESS_VALUE: 500,
    MAX_COMPLEXITY: 500,
    VALUE_RANGE: 650,
} as const;

export const DEFAULT_PROJECTS: ProjectBubble[] = [
    { id: 1, name: 'ERP Migration', service: 'Finance', complexity: 450, value: 480, startDate: new Date(2026, 4, 15) }, // May
    { id: 2, name: 'Website Redesign', service: 'Marketing', complexity: 200, value: 350, startDate: new Date(2026, 6, 1) }, // July
    { id: 3, name: 'Cloud Security Audit', service: 'IT', complexity: 300, value: 150, startDate: new Date(2026, 8, 10) }, // September
    { id: 4, name: 'Recruitment Portal', service: 'HR', complexity: 100, value: 250, startDate: new Date(2026, 5, 20) }, // June
    { id: 5, name: 'Q3 Budget Planning', service: 'Finance', complexity: 50, value: 400, startDate: new Date(2026, 7, 5) }, // August
];
