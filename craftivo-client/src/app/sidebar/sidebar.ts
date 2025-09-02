import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  isCollapsed = signal(false);
  isOpen = signal(false);
  projectCount = signal(8);

  toggleSidebar() {
    if (window.innerWidth <= 1024) {
      this.isOpen.update((value) => !value);
    } else {
      this.isCollapsed.update((value) => !value);
    }
  }
}
