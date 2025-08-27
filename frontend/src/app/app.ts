import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <div style="padding: 20px; background: white; min-height: 100vh;">
      <router-outlet></router-outlet>
    </div>
  `
})
export class App {
  protected readonly title = signal('project');
}
