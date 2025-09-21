import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  template: '<h1 class="visually-hidden">App</h1><router-outlet></router-outlet>',
  styleUrl: './app.css',
})
export class App {}
