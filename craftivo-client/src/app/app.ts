import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  template: '<router-outlet></router-outlet>',
  styleUrl: './app.css',
})
export class App {
  // Removed redundant auth check - AuthGuard handles authentication
  // This prevents duplicate API calls on app initialization
}
