import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import type { OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonContent } from '@ionic/angular';

import { SegmentedTabsComponent } from '../../../shared/components/segmented-tabs/segmented-tabs.component';
import type { SegmentedTabOption } from '../../../shared/components/segmented-tabs/segmented-tabs.component';
import { HeaderComponent } from '../../../shared/header/header.component';
import { ListsService, type WorkspaceList, type WorkspaceListItem } from '../../../shared/services/lists.service';

@Component({
  selector: 'app-organize',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, HeaderComponent, SegmentedTabsComponent],
  templateUrl: './organize.page.html',
})
export class OrganizePage implements OnInit, OnDestroy {
  private readonly listsService = inject(ListsService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = this.listsService.loading;
  readonly syncing = this.listsService.syncing;
  readonly error = this.listsService.error;
  readonly organizeTabs: readonly SegmentedTabOption[] = [
    { id: 'tasks', label: 'Tareas', hint: 'Próximamente', disabled: true, ariaLabel: 'Tareas, próximamente' },
    { id: 'lists', label: 'Listas' },
    { id: 'notes', label: 'Notas', hint: 'Próximamente', disabled: true, ariaLabel: 'Notas, próximamente' },
  ];
  readonly activeTab = signal<'tasks' | 'lists' | 'notes'>('lists');
  readonly selectedListId = signal<string | null>(null);
  readonly newListName = signal('');
  readonly newItemName = signal('');
  readonly clearConfirmation = signal(false);
  readonly hideClearConfirmation = signal(false);
  newListNameText = '';
  newItemNameText = '';
  hideClearConfirmationValue = false;

  async ngOnInit(): Promise<void> {
    await this.listsService.load();
    const requestedList = this.route.snapshot.queryParamMap.get('list');
    const rememberedList = sessionStorage.getItem('haven-selected-list');
    const shopping = this.listsService.getActiveLists().find((list) => list.key === 'shopping');
    const requested =
      requestedList === 'shopping'
        ? shopping
        : this.listsService.getActiveLists().find((list) => list.id === requestedList);
    this.selectedListId.set(
      requested?.id ?? rememberedList ?? shopping?.id ?? this.listsService.getActiveLists()[0]?.id ?? null,
    );
  }

  ngOnDestroy(): void {
    this.listsService.destroy();
  }

  get lists(): WorkspaceList[] {
    return this.listsService.getActiveLists();
  }

  get selectedList(): WorkspaceList | null {
    return this.lists.find((list) => list.id === this.selectedListId()) ?? null;
  }

  get items(): WorkspaceListItem[] {
    return this.selectedListId() ? this.listsService.getActiveItems(this.selectedListId()!) : [];
  }

  get completedCount(): number {
    return this.items.filter((item) => item.completed).length;
  }

  selectList(listId: string): void {
    this.selectedListId.set(listId);
    sessionStorage.setItem('haven-selected-list', listId);
  }

  async addList(): Promise<void> {
    await this.listsService.createList(this.newListNameText);
    this.newListNameText = '';
  }

  async renameList(list: WorkspaceList): Promise<void> {
    if (list.isDefault) return;
    const name = window.prompt('Nuevo nombre de la lista', list.name)?.trim();
    if (name) await this.listsService.renameList(list.id, name);
  }

  async removeList(list: WorkspaceList): Promise<void> {
    if (list.isDefault) return;
    if (!window.confirm(`¿Eliminar "${list.name}" y sus elementos?`)) return;
    await this.listsService.deleteList(list.id);
    if (this.selectedListId() === list.id) {
      this.selectList(this.lists[0]?.id ?? '');
    }
  }

  async addItem(): Promise<void> {
    if (!this.selectedListId()) return;
    await this.listsService.createItem(this.selectedListId()!, this.newItemNameText);
    this.newItemNameText = '';
  }

  async renameItem(item: WorkspaceListItem): Promise<void> {
    const name = window.prompt('Editar elemento', item.name)?.trim();
    if (name) await this.listsService.renameItem(item.id, name);
  }

  async toggleItem(item: WorkspaceListItem): Promise<void> {
    await this.listsService.toggleItem(item.id);
  }

  async removeItem(item: WorkspaceListItem): Promise<void> {
    await this.listsService.deleteItem(item.id);
  }

  requestClearCompleted(): void {
    if (localStorage.getItem('haven-hide-clear-confirmation') === 'true') {
      void this.clearCompleted();
      return;
    }
    this.clearConfirmation.set(true);
  }

  async clearCompleted(): Promise<void> {
    if (!this.selectedListId()) return;
    if (this.hideClearConfirmationValue) {
      localStorage.setItem('haven-hide-clear-confirmation', 'true');
    }
    await this.listsService.clearCompleted(this.selectedListId()!);
    this.clearConfirmation.set(false);
  }

  cancelClearCompleted(): void {
    this.clearConfirmation.set(false);
  }

  setActiveTab(tab: string): void {
    if (tab === 'lists') {
      this.activeTab.set(tab);
    }
  }
}
