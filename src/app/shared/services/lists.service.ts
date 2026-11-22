import { inject, Injectable, signal } from '@angular/core';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { SupabaseService } from './supabase.service';

export interface WorkspaceList {
  id: string;
  workspaceId: string;
  key: string | null;
  name: string;
  isDefault: boolean;
  sortOrder: number;
  deletedAt: string | null;
}

export interface WorkspaceListItem {
  id: string;
  workspaceId: string;
  listId: string;
  name: string;
  completed: boolean;
  sortOrder: number;
  deletedAt: string | null;
}

type QueuedOperation =
  | { id: string; type: 'createList'; name: string; listId: string }
  | { id: string; type: 'renameList'; listId: string; name: string }
  | { id: string; type: 'deleteList'; listId: string }
  | { id: string; type: 'createItem'; listId: string; itemId: string; name: string }
  | { id: string; type: 'renameItem'; itemId: string; name: string }
  | { id: string; type: 'toggleItem'; itemId: string; completed: boolean }
  | { id: string; type: 'deleteItem'; itemId: string }
  | { id: string; type: 'clearCompleted'; listId: string; itemIds: string[] };

@Injectable({ providedIn: 'root' })
export class ListsService {
  private readonly supabase = inject(SupabaseService);
  private workspaceId: string | null = null;
  private realtimeChannel: RealtimeChannel | null = null;
  private readonly queue: QueuedOperation[] = [];

  readonly lists = signal<WorkspaceList[]>([]);
  readonly items = signal<WorkspaceListItem[]>([]);
  readonly loading = signal(false);
  readonly syncing = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => void this.syncPending());
    }
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    await this.restoreCache();
    try {
      this.workspaceId = await this.resolveWorkspaceId();
      await this.supabase.client.rpc('ensure_workspace_lists', { p_workspace_id: this.workspaceId });
      await this.fetchRemote();
      await this.syncPending();
      this.subscribeRealtime();
    } catch (error) {
      this.error.set(this.toErrorMessage(error, 'No se pudieron cargar las listas.'));
    } finally {
      this.loading.set(false);
    }
  }

  async refresh(): Promise<void> {
    if (!this.workspaceId) {
      await this.load();
      return;
    }
    await this.syncPending();
    await this.fetchRemote();
  }

  async createList(name: string): Promise<void> {
    const cleaned = name.trim();
    if (!cleaned) return;
    const list: WorkspaceList = {
      id: this.newId(),
      workspaceId: this.workspaceId ?? '',
      key: null,
      name: cleaned,
      isDefault: false,
      sortOrder: this.lists().length,
      deletedAt: null,
    };
    this.lists.update((lists) => [...lists, list]);
    await this.queueOrRun({ id: this.newId(), type: 'createList', name: cleaned, listId: list.id });
  }

  async renameList(listId: string, name: string): Promise<void> {
    const cleaned = name.trim();
    const list = this.lists().find((entry) => entry.id === listId);
    if (!cleaned || list?.isDefault) return;
    this.lists.update((lists) => lists.map((entry) => entry.id === listId ? { ...entry, name: cleaned } : entry));
    await this.queueOrRun({ id: this.newId(), type: 'renameList', listId, name: cleaned });
  }

  async deleteList(listId: string): Promise<void> {
    const list = this.lists().find((entry) => entry.id === listId);
    if (list?.isDefault) return;
    this.lists.update((lists) => lists.map((entry) => entry.id === listId ? { ...entry, deletedAt: new Date().toISOString() } : entry));
    this.items.update((items) => items.map((item) => item.listId === listId ? { ...item, deletedAt: new Date().toISOString() } : item));
    await this.queueOrRun({ id: this.newId(), type: 'deleteList', listId });
  }

  async createItem(listId: string, name: string): Promise<void> {
    const cleaned = name.trim();
    if (!cleaned) return;
    const item: WorkspaceListItem = {
      id: this.newId(),
      workspaceId: this.workspaceId ?? '',
      listId,
      name: cleaned,
      completed: false,
      sortOrder: this.items().filter((entry) => entry.listId === listId).length,
      deletedAt: null,
    };
    this.items.update((items) => [...items, item]);
    await this.queueOrRun({ id: this.newId(), type: 'createItem', listId, itemId: item.id, name: cleaned });
  }

  async renameItem(itemId: string, name: string): Promise<void> {
    const cleaned = name.trim();
    if (!cleaned) return;
    this.items.update((items) => items.map((item) => item.id === itemId ? { ...item, name: cleaned } : item));
    await this.queueOrRun({ id: this.newId(), type: 'renameItem', itemId, name: cleaned });
  }

  async toggleItem(itemId: string): Promise<void> {
    const item = this.items().find((entry) => entry.id === itemId);
    if (!item) return;
    const completed = !item.completed;
    this.items.update((items) => items.map((entry) => entry.id === itemId ? { ...entry, completed } : entry));
    await this.queueOrRun({ id: this.newId(), type: 'toggleItem', itemId, completed });
  }

  async deleteItem(itemId: string): Promise<void> {
    this.items.update((items) => items.map((item) => item.id === itemId ? { ...item, deletedAt: new Date().toISOString() } : item));
    await this.queueOrRun({ id: this.newId(), type: 'deleteItem', itemId });
  }

  async clearCompleted(listId: string): Promise<void> {
    const completedIds = this.items()
      .filter((item) => item.listId === listId && item.completed && !item.deletedAt)
      .map((item) => item.id);
    if (completedIds.length === 0) return;
    this.items.update((items) =>
      items.map((item) => completedIds.includes(item.id) ? { ...item, deletedAt: new Date().toISOString() } : item),
    );
    await this.queueOrRun({ id: this.newId(), type: 'clearCompleted', listId, itemIds: completedIds });
  }

  getActiveLists(): WorkspaceList[] {
    return this.lists().filter((list) => !list.deletedAt).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getActiveItems(listId: string): WorkspaceListItem[] {
    return this.items()
      .filter((item) => item.listId === listId && !item.deletedAt)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getShoppingSummary(): { pending: number; completed: number } {
    const shopping = this.lists().find((list) => list.key === 'shopping' && !list.deletedAt);
    if (!shopping) return { pending: 0, completed: 0 };
    const active = this.items().filter((item) => item.listId === shopping.id && !item.deletedAt);
    return {
      pending: active.filter((item) => !item.completed).length,
      completed: active.filter((item) => item.completed).length,
    };
  }

  destroy(): void {
    if (this.realtimeChannel) {
      void this.supabase.client.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }

  private async resolveWorkspaceId(): Promise<string> {
    const { data: userData, error: userError } = await this.supabase.client.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error('No hay una sesión autenticada.');
    const { data, error } = await this.supabase.client
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userData.user.id);
    if (error) throw error;
    const ids = [...new Set((data ?? []).map((row) => row.workspace_id))];
    if (ids.length !== 1) throw new Error(`Se esperaba un workspace y se encontraron ${ids.length}.`);
    return ids[0];
  }

  private async fetchRemote(): Promise<void> {
    if (!this.workspaceId) return;
    const [listsResponse, itemsResponse] = await Promise.all([
      this.supabase.client
        .from('lists')
        .select('id,workspace_id,key,name,is_default,sort_order,is_archived,deleted_at')
        .eq('workspace_id', this.workspaceId)
        .order('sort_order', { ascending: true }),
      this.supabase.client
        .from('list_items')
        .select('id,workspace_id,list_id,name,is_completed,position,deleted_at')
        .eq('workspace_id', this.workspaceId)
        .order('position', { ascending: true }),
    ]);
    if (listsResponse.error) throw listsResponse.error;
    if (itemsResponse.error) throw itemsResponse.error;
    let remoteLists = (listsResponse.data ?? []).map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      key: row.key,
      name: row.name,
      isDefault: row.is_default,
      sortOrder: row.sort_order,
      deletedAt: row.deleted_at ?? (row.is_archived ? 'archived' : null),
    }));
    let remoteItems = (itemsResponse.data ?? []).map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      listId: row.list_id,
      name: row.name,
      completed: row.is_completed,
      sortOrder: row.position,
      deletedAt: row.deleted_at,
    }));
    await this.restoreQueue();
    for (const operation of this.queue) {
      switch (operation.type) {
        case 'createList':
          if (!remoteLists.some((list) => list.id === operation.listId)) {
            remoteLists = [...remoteLists, {
              id: operation.listId,
              workspaceId: this.workspaceId,
              key: null,
              name: operation.name,
              isDefault: false,
              sortOrder: remoteLists.length,
              deletedAt: null,
            }];
          }
          break;
        case 'renameList':
          remoteLists = remoteLists.map((list) => list.id === operation.listId ? { ...list, name: operation.name } : list);
          break;
        case 'deleteList':
          remoteLists = remoteLists.map((list) => list.id === operation.listId ? { ...list, deletedAt: new Date().toISOString() } : list);
          break;
        case 'createItem':
          if (!remoteItems.some((item) => item.id === operation.itemId)) {
            remoteItems = [...remoteItems, {
              id: operation.itemId,
              workspaceId: this.workspaceId,
              listId: operation.listId,
              name: operation.name,
              completed: false,
              sortOrder: remoteItems.filter((item) => item.listId === operation.listId).length,
              deletedAt: null,
            }];
          }
          break;
        case 'renameItem':
          remoteItems = remoteItems.map((item) => item.id === operation.itemId ? { ...item, name: operation.name } : item);
          break;
        case 'toggleItem':
          remoteItems = remoteItems.map((item) => item.id === operation.itemId ? { ...item, completed: operation.completed } : item);
          break;
        case 'deleteItem':
          remoteItems = remoteItems.map((item) => item.id === operation.itemId ? { ...item, deletedAt: new Date().toISOString() } : item);
          break;
        case 'clearCompleted':
          remoteItems = remoteItems.map((item) =>
            operation.itemIds.includes(item.id) ? { ...item, deletedAt: new Date().toISOString() } : item,
          );
          break;
      }
    }
    this.lists.set(remoteLists);
    this.items.set(remoteItems);
    await this.saveCache();
  }

  private async queueOrRun(operation: QueuedOperation): Promise<void> {
    await this.saveCache();
    if (!navigator.onLine) {
      this.queue.push(operation);
      await this.saveQueue();
      this.syncing.set(false);
      return;
    }
    try {
      await this.execute(operation);
      await this.fetchRemote();
    } catch (error) {
      this.queue.push(operation);
      await this.saveQueue();
      this.error.set(this.toErrorMessage(error, 'El cambio no se pudo guardar.'));
    }
  }

  private async syncPending(): Promise<void> {
    await this.restoreQueue();
    if (this.queue.length === 0 || !navigator.onLine) return;
    this.syncing.set(true);
    const remaining: QueuedOperation[] = [];
    for (const operation of this.queue) {
      try {
        await this.execute(operation);
      } catch {
        remaining.push(operation);
      }
    }
    this.queue.splice(0, this.queue.length, ...remaining);
    await this.saveQueue();
    await this.fetchRemote();
    this.syncing.set(false);
  }

  private async execute(operation: QueuedOperation): Promise<void> {
    const client = this.supabase.client;
    if (!this.workspaceId) throw new Error('No se pudo resolver el workspace.');
    switch (operation.type) {
      case 'createList': {
        const { error } = await client.from('lists').insert({
          id: operation.listId, workspace_id: this.workspaceId, name: operation.name,
          type: 'custom', is_default: false,
          sort_order: this.lists().find((list) => list.id === operation.listId)?.sortOrder ?? 0,
          created_by: (await client.auth.getUser()).data.user?.id,
        });
        if (error) throw error;
        break;
      }
      case 'renameList': {
        const { error } = await client.from('lists').update({ name: operation.name }).eq('id', operation.listId);
        if (error) throw error;
        break;
      }
      case 'deleteList': {
        const { error } = await client.from('lists').update({ deleted_at: new Date().toISOString(), is_archived: true }).eq('id', operation.listId);
        if (error) throw error;
        break;
      }
      case 'createItem': {
        const { error } = await client.from('list_items').insert({
          id: operation.itemId, workspace_id: this.workspaceId, list_id: operation.listId,
          name: operation.name, is_completed: false,
          position: this.items().filter((item) => item.listId === operation.listId).length,
          created_by: (await client.auth.getUser()).data.user?.id,
        });
        if (error) throw error;
        break;
      }
      case 'renameItem': {
        const { error } = await client.from('list_items').update({ name: operation.name }).eq('id', operation.itemId);
        if (error) throw error;
        break;
      }
      case 'toggleItem': {
        const { error } = await client.from('list_items').update({ is_completed: operation.completed }).eq('id', operation.itemId);
        if (error) throw error;
        break;
      }
      case 'deleteItem':
      case 'clearCompleted': {
        const ids = operation.type === 'deleteItem' ? [operation.itemId] : operation.itemIds;
        const { error } = await client.from('list_items')
          .update({ deleted_at: new Date().toISOString(), is_completed: false })
          .in('id', ids);
        if (error) throw error;
        break;
      }
    }
  }

  private subscribeRealtime(): void {
    if (this.realtimeChannel || !this.workspaceId) return;
    this.realtimeChannel = this.supabase.client
      .channel(`workspace-lists-${this.workspaceId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'lists',
        filter: `workspace_id=eq.${this.workspaceId}`,
      }, () => void this.fetchRemote().catch((error) => this.error.set(this.toErrorMessage(error))))
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'list_items',
        filter: `workspace_id=eq.${this.workspaceId}`,
      }, () => void this.fetchRemote().catch((error) => this.error.set(this.toErrorMessage(error))))
      .subscribe();
  }

  private openDatabase(): Promise<IDBDatabase | null> {
    if (!globalThis.indexedDB) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('haven-lists', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('state')) db.createObjectStore('state');
        if (!db.objectStoreNames.contains('queue')) db.createObjectStore('queue');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async restoreCache(): Promise<void> {
    const db = await this.openDatabase();
    if (!db) return;
    const value = await this.readStore(db, 'state');
    if (value && typeof value === 'object' && 'lists' in value && 'items' in value) {
      this.lists.set((value as { lists: WorkspaceList[] }).lists);
      this.items.set((value as { items: WorkspaceListItem[] }).items);
    }
  }

  private async saveCache(): Promise<void> {
    const db = await this.openDatabase();
    if (!db) return;
    await this.writeStore(db, 'state', { lists: this.lists(), items: this.items() });
  }

  private async restoreQueue(): Promise<void> {
    const db = await this.openDatabase();
    if (!db) return;
    const value = await this.readStore(db, 'queue');
    if (Array.isArray(value)) {
      this.queue.splice(0, this.queue.length, ...value as QueuedOperation[]);
    }
  }

  private async saveQueue(): Promise<void> {
    const db = await this.openDatabase();
    if (!db) return;
    await this.writeStore(db, 'queue', [...this.queue]);
  }

  private readStore(db: IDBDatabase, storeName: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const request = transaction.objectStore(storeName).get('data');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private writeStore(db: IDBDatabase, storeName: string, value: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).put(value, 'data');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  private newId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private toErrorMessage(error: unknown, fallback = 'Ocurrió un error con las listas.'): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
      return error.message;
    }
    return fallback;
  }
}
