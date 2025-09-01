import { Component } from '@angular/core';
import { LandingPage } from './landing-page/landing-page';
import { Navbar } from './navbar/navbar';

@Component({
  selector: 'app-root',
  imports: [LandingPage, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
