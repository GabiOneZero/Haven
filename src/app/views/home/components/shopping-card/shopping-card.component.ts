import { Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HomeFeatureCardComponent } from '../../../../shared/components/home-feature-card/home-feature-card.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ListsService } from '../../../../shared/services/lists.service';

@Component({
  selector: 'app-shopping-card',
  standalone: true,
  imports: [HomeFeatureCardComponent, IconComponent, RouterLink],
  templateUrl: './shopping-card.component.html',
  styleUrl: './shopping-card.component.scss',
})
export class ShoppingCardComponent implements OnInit {
  private readonly listsService = inject(ListsService);
  private readonly shoppingSummary = computed(() => this.listsService.getShoppingSummary());
  readonly summaryLoading = signal(true);
  readonly uncheckedCount = computed(() => this.shoppingSummary().unchecked);
  readonly accentColor = computed(() => this.getAccentColor());
  readonly iconBackgroundColor = computed(() => this.getIconBackgroundColor());

  async ngOnInit(): Promise<void> {
    await this.listsService.load();
    this.summaryLoading.set(false);
  }

  private getAccentColor(): string {
    if (this.summaryLoading()) {
      return 'var(--haven-shopping-accent)';
    }

    const uncheckedCount = this.uncheckedCount();
    if (uncheckedCount === 0) {
      return 'var(--haven-decision-wheel-green)';
    }

    return uncheckedCount >= 6
      ? 'var(--haven-decision-wheel-coral)'
      : 'var(--haven-shopping-accent)';
  }

  private getIconBackgroundColor(): string {
    return !this.summaryLoading() && this.uncheckedCount() === 0
      ? 'var(--haven-question-status-bg)'
      : 'var(--haven-shopping-icon-bg)';
  }
}