import { Component, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  template: '<router-outlet></router-outlet>',
  styleUrl: './app.css',
})
export class App implements OnInit {
  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.checkAuthStatus();
  }
}
