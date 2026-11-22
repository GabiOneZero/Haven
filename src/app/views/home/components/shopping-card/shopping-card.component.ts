import { Component, effect, inject, signal } from '@angular/core';
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
  readonly pendingCount = signal(0);
  readonly summaryLoading = signal(true);

  constructor() {
    effect(() => {
      this.listsService.lists();
      this.listsService.items();
      this.updateSummary();
    });
  }

  async ngOnInit(): Promise<void> {
    await this.listsService.load();
    this.updateSummary();
    this.summaryLoading.set(false);
  }

  updateSummary(): void {
    this.pendingCount.set(this.listsService.getShoppingSummary().pending);
  }
}