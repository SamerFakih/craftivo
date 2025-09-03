import { Component } from '@angular/core';
import { Navbar } from '../navbar/navbar';
import { CommonModule } from '@angular/common';
import { Footer } from '../footer/footer';
import { RouterModule } from '@angular/router';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge: {
    text: string;
    type: 'ai-powered' | 'automated' | 'real-time' | 'collaborative' | 'connected';
  };
}

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [Navbar, CommonModule, Footer, RouterModule],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
})
export class LandingPage {
  features: Feature[] = [
    {
      id: 'task-management',
      title: 'Smart Task Management',
      description:
        'Organize tasks with intelligent prioritization, deadline tracking, and automated email reminders to keep projects on schedule.',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      badge: {
        text: 'AI Powered',
        type: 'ai-powered',
      },
    },
    {
      id: 'invoicing',
      title: 'Professional Invoicing',
      description:
        'Create beautiful invoices with automatic calculations, payment tracking, and client-friendly payment portals.',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      badge: {
        text: 'Automated',
        type: 'automated',
      },
    },
    {
      id: 'time-tracking',
      title: 'Team Time Tracking',
      description:
        'Track time across projects with team collaboration, productivity insights, and accurate billing calculations.',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      badge: {
        text: 'Real-time',
        type: 'real-time',
      },
    },
    {
      id: 'collaboration',
      title: 'Team Collaboration',
      description:
        'Invite team members, assign roles, and manage permissions with integrated communication tools.',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z',
      badge: {
        text: 'Collaborative',
        type: 'collaborative',
      },
    },
    {
      id: 'email-integration',
      title: 'Email Integration',
      description:
        'Seamlessly connect with Gmail, Outlook, and other email providers for automated notifications and follow-ups.',
      icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      badge: {
        text: 'Connected',
        type: 'connected',
      },
    },
    {
      id: 'financial-analytics',
      title: 'Financial Analytics',
      description:
        'Track earnings, expenses, and project profitability with comprehensive financial reporting and forecasting.',
      icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
      badge: {
        text: 'AI Powered',
        type: 'ai-powered',
      },
    },
  ];

  trackByFeatureId(index: number, feature: Feature): string {
    return feature.id;
  }
}
