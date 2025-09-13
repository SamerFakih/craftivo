import { Component, signal, OnDestroy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarService } from './sidebar.service';
import { AuthService } from '../services/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isCollapsed = signal(false);
  isOpen = signal(false); // Start closed on mobile, open on desktop
  isMobile = signal(false);

  constructor(private sidebarService: SidebarService, private authService: AuthService) {}

  ngOnInit() {
    // Check initial screen size
    this.checkScreenSize();

    // Listen to sidebar service
    this.sidebarService.isOpen$.pipe(takeUntil(this.destroy$)).subscribe((open) => {
      if (this.isMobile()) {
        this.isOpen.set(open);
      } else {
        // On desktop, sidebar is always open
        this.isOpen.set(true);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    const isMobile = window.innerWidth <= 1024;
    this.isMobile.set(isMobile);

    if (!isMobile) {
      // Desktop: always show sidebar
      this.isOpen.set(true);
    } else {
      // Mobile: only show if explicitly opened
      this.isOpen.set(this.sidebarService.isOpen);
    }
  }

  closeSidebar() {
    if (this.isMobile()) {
      this.sidebarService.close();
    }
  }
}
