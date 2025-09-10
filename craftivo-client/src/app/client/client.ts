import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientModel } from '../models/client';
import { ClientCard } from '../components/client-card/client-card';

@Component({
  selector: 'app-clients-page',
  standalone: true,
  imports: [CommonModule, ClientCard],
  templateUrl: './client.html',
  styleUrls: ['./client.css'],
})
export class Client {
  // demo data – replace with API
  clients = signal<ClientModel[]>([
    {
      id: 'c1',
      name: 'TechCorp Inc.',
      status: 'active',
      email: 'sarah@techcorp.com',
      location: 'San Francisco, CA',
      primaryContact: 'Sarah Williams',
      industry: 'Technology',
      joinedISO: '2024-01-15',
      tags: ['Technology', 'Long-term', 'High-value'],
      stats: {
        totalProjects: 4,
        activeProjects: 1,
        totalRevenueUSD: 12800,
        lastContactISO: '2024-08-20',
      },
      rating: 4.9,
    },
    {
      id: 'c2',
      name: 'NorthPeak Co.',
      status: 'active',
      email: 'ops@northpeak.com',
      location: 'Seattle, WA',
      primaryContact: 'Tina Park',
      industry: 'SaaS',
      joinedISO: '2023-12-10',
      tags: ['B2B', 'Subscription'],
      stats: {
        totalProjects: 6,
        activeProjects: 2,
        totalRevenueUSD: 22500,
        lastContactISO: '2024-08-18',
      },
      rating: 4.7,
    },
    {
      id: 'c3',
      name: 'FlowBoard',
      status: 'inactive',
      email: 'cto@flowboard.io',
      location: 'Remote',
      primaryContact: 'R. Patel',
      industry: 'Analytics',
      joinedISO: '2023-11-02',
      tags: ['Analytics', 'Startup'],
      stats: {
        totalProjects: 2,
        activeProjects: 0,
        totalRevenueUSD: 5400,
        lastContactISO: '2024-07-28',
      },
      rating: 4.6,
    },
    {
      id: 'c4',
      name: 'Salesify',
      status: 'active',
      email: 'pm@salesify.com',
      location: 'New York, NY',
      primaryContact: 'Greg Rowe',
      industry: 'Commerce',
      joinedISO: '2024-03-01',
      tags: ['E-commerce', 'Marketing'],
      stats: {
        totalProjects: 3,
        activeProjects: 1,
        totalRevenueUSD: 16800,
        lastContactISO: '2024-08-19',
      },
      rating: 5,
    },
  ]);

  // search
  q = signal('');
  onSearchInput(e: Event) {
    this.q.set((e.target as HTMLInputElement).value);
  }

  // KPIs
  totalClients = computed(() => this.clients().length);
  activeClients = computed(() => this.clients().filter((c) => c.status === 'active').length);
  totalRevenue = computed(() => this.clients().reduce((s, c) => s + c.stats.totalRevenueUSD, 0));
  avgRating = computed(() => {
    const arr = this.clients().map((c) => c.rating ?? 0);
    return arr.length ? +(arr.reduce((s, x) => s + x, 0) / arr.length).toFixed(1) : 0;
  });

  filtered = computed(() => {
    const term = this.q().toLowerCase().trim();
    if (!term) return this.clients();
    return this.clients().filter((c) =>
      (c.name + ' ' + c.primaryContact + ' ' + c.industry + ' ' + c.tags.join(' '))
        .toLowerCase()
        .includes(term)
    );
  });

  money(n: number) {
    return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
}
