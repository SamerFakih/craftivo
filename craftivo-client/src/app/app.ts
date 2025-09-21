import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<h1 class="visually-hidden">App</h1><router-outlet></router-outlet>',
  styleUrls: ['./app.css'],
})
export class App {}
