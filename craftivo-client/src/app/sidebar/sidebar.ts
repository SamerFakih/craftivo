import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarService } from './sidebar.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  isCollapsed = signal(false);
  isOpen = signal(true);
  projectCount = signal(8);

  constructor(private sidebarService: SidebarService, private authService: AuthService) {
    this.sidebarService.isOpen$.subscribe((open) => this.isOpen.set(open));
  }
}
