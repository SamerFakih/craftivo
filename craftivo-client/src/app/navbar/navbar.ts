import {
  Component,
  signal,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  computed,
  Signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarService } from '../sidebar/sidebar.service';
import { AuthService } from '../services/auth.service';
import { Subject, takeUntil } from 'rxjs';

interface Notification {
  id: string;
  message: string;
  time: string;
  read: boolean;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private isBrowser: boolean;

  // App branding
  protected readonly title = signal('Craftivo');

  // Authentication state
  // Use AuthService signals directly
  isLoggedIn: Signal<boolean>;
  userName: Signal<string>;
  userAvatar: Signal<string>;

  // Search functionality
  searchQuery = '';

  // UI state
  showUserMenu = signal(false);
  showNotifications = signal(false);

  // Notifications
  notifications = signal<Notification[]>([
    {
      id: '1',
      message: 'New project "E-commerce Redesign" assigned to you',
      time: '2 minutes ago',
      read: false,
    },
    {
      id: '2',
      message: 'Invoice #INV-001 has been paid',
      time: '1 hour ago',
      read: false,
    },
    {
      id: '3',
      message: 'Team member Sarah completed wireframe task',
      time: '3 hours ago',
      read: true,
    },
  ]);

  hasNotifications = signal(true);
  notificationCount = signal(2);

  constructor(
    private sidebarService: SidebarService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isLoggedIn = this.authService.isLoggedIn;
    this.userName = computed(() => {
      const user = this.authService.currentUser();
      console.log('Current user in navbar:', user);
      if (user && user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`;
      }
      return 'John Doe';
    });
    this.userAvatar = computed(() => {
      const user = this.authService.currentUser();
      return user?.avatar || '/assets/craftivo-logo.png';
    });
  }

  ngOnInit() {
    // Close dropdowns when clicking outside (only in browser)
    if (this.isBrowser) {
      this.document.addEventListener('click', this.handleOutsideClick.bind(this));
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    // Remove event listener (only in browser)
    if (this.isBrowser) {
      this.document.removeEventListener('click', this.handleOutsideClick.bind(this));
    }
  }

  // Sidebar control
  toggleSidebar() {
    this.sidebarService.toggle();
  }

  // Search functionality
  onSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery = query;
    // Implement search logic here
    console.log('Searching for:', query);
  }

  // User menu
  toggleUserMenu() {
    this.showUserMenu.set(!this.showUserMenu());
    this.showNotifications.set(false); // Close notifications when opening user menu
  }

  // Notifications
  toggleNotifications() {
    this.showNotifications.set(!this.showNotifications());
    this.showUserMenu.set(false); // Close user menu when opening notifications
  }

  markAllAsRead() {
    const updatedNotifications = this.notifications().map((notif) => ({
      ...notif,
      read: true,
    }));
    this.notifications.set(updatedNotifications);
    this.notificationCount.set(0);
    this.hasNotifications.set(false);
  }

  // Authentication actions
  login() {
    // In real app, this would call AuthService
    // Example: this.authService.login(email, password)
  }

  logout() {
    this.authService.logout();
    this.showUserMenu.set(false);
  }

  // Handle clicks outside dropdowns
  private handleOutsideClick(event: Event) {
    const target = event.target as HTMLElement;

    // Check if click is outside user menu
    if (!target.closest('.user-menu') && !target.closest('.user-dropdown')) {
      this.showUserMenu.set(false);
    }

    // Check if click is outside notifications
    if (!target.closest('.notif-btn') && !target.closest('.notifications-dropdown')) {
      this.showNotifications.set(false);
    }
  }
}
