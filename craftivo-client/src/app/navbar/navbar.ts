import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarService } from '../sidebar/sidebar.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  protected readonly title = signal('Craftivo');
  isLoggedIn = signal(false); // Set to true if user is logged in
  userName = signal('John Doe'); // Example user name
  userAvatar = signal('/assets/avatar.png'); // Example avatar path

  constructor(private sidebarService: SidebarService) {}

  toggleSidebar() {
    this.sidebarService.toggle();
  }

  // Simulate login/logout for demo
  login() {
    this.isLoggedIn.set(true);
  }
  logout() {
    this.isLoggedIn.set(false);
  }
}
