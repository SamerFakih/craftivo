import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true, // Add this line
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  protected readonly title = signal('Craftivo');
}
