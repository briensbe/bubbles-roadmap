import { Component } from '@angular/core';
import { MarkdownModule } from 'ngx-markdown';

@Component({
    selector: 'app-guide-view',
    standalone: true,
    imports: [MarkdownModule],
    template: `
    <div class="guide-container">
      <markdown [src]="'assets/GUIDE.md'"></markdown>
    </div>
  `,
    styles: [`
    .guide-container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 2rem;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow-y: auto;
      height: calc(100vh - 150px);
    }
    /* Basic markdown styling fallback if no prose class */
    :host ::ng-deep h1 { font-size: 2em; margin-bottom: 0.5em; font-weight: bold; }
    :host ::ng-deep h2 { font-size: 1.5em; margin-top: 1em; margin-bottom: 0.5em; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 0.25em; }
    :host ::ng-deep h3 { font-size: 1.25em; margin-top: 1em; margin-bottom: 0.5em; font-weight: bold; }
    :host ::ng-deep p { margin-bottom: 1em; line-height: 1.6; }
    :host ::ng-deep ul { list-style-type: disc; margin-left: 1.5em; margin-bottom: 1em; }
    :host ::ng-deep li { margin-bottom: 0.25em; }
    :host ::ng-deep code { background: #f5f5f5; padding: 0.2em 0.4em; border-radius: 3px; font-family: monospace; }
    :host ::ng-deep pre { background: #f5f5f5; padding: 1em; border-radius: 5px; overflow-x: auto; margin-bottom: 1em; }
    :host ::ng-deep blockquote { border-left: 4px solid #ddd; padding-left: 1em; color: #666; margin-left: 0; }
  `]
})
export class GuideViewComponent { }
