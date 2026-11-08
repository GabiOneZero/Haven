import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../components/icon/icon.component';
import { HomeIconPaths } from './home-icon-paths';;

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [IconComponent, CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Input() title: string = '';
  @Input() streakDays: number = 5;
  @Input() hasUnreadNotifications: boolean = true;

  @Output() notificationClick = new EventEmitter<void>();
  @Output() streakClick = new EventEmitter<void>();

  bellPaths = HomeIconPaths.bell;
  flamePaths = HomeIconPaths.flame;

  onNotificationClick(): void {
    this.notificationClick.emit();
  }

  onStreakClick(): void {
    this.streakClick.emit();
  }
}
