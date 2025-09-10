import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Member } from '../../models/team';

@Component({
  selector: 'app-member-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './member-card.html',
  styleUrls: ['./member-card.css'],
})
export class MemberCard {
  @Input({ required: true }) member!: Member;

  pillClass() {
    return this.member.status === 'active' ? 'pill pill--active' : 'pill pill--inactive';
  }

  get rateLabel() {
    return `${this.member.hourlyRateUSD}/hr`;
  }
  get hoursLabel() {
    return `${this.member.hoursMonth}h`;
  }
  get projectsLabel() {
    return `${this.member.activeProjects}`;
  }
  get tasksLabel() {
    return `${this.member.tasksDone}`;
  }
}
