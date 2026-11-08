import { Component, EventEmitter, Input, Output } from '@angular/core';
import { HomeIconComponent } from '../icons/home-icon/home-icon.component';
import { HomeIconPaths } from '../constants/icons';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [HomeIconComponent],
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
