export type QuickAddKind = 'event' | 'shopping' | 'task' | 'note';

export interface QuickAddAction {
  readonly kind: QuickAddKind;
  readonly label: string;
  readonly icon: string;
  /** CSS custom property holding the fill colour of the tile. */
  readonly accent: string;
  /** CSS custom property holding the deep tint used while the tile is pressed. */
  readonly chip: string;
}

/**
 * Tiles shown in the quick-add sheet, in reading order (2x2 grid).
 * Colours come from variables.scss so the sheet stays in sync with the palette.
 */
export const QUICK_ADD_ACTIONS: readonly QuickAddAction[] = [
  {
    kind: 'event',
    label: 'Evento',
    icon: 'calendar',
    accent: 'var(--haven-quick-add-event-accent)',
    chip: 'var(--haven-quick-add-event-chip)',
  },
  {
    kind: 'shopping',
    label: 'Compra',
    icon: 'cart',
    accent: 'var(--haven-quick-add-shopping-accent)',
    chip: 'var(--haven-quick-add-shopping-chip)',
  },
  {
    kind: 'task',
    label: 'Tarea',
    icon: 'task',
    accent: 'var(--haven-quick-add-task-accent)',
    chip: 'var(--haven-quick-add-task-chip)',
  },
  {
    kind: 'note',
    label: 'Nota',
    icon: 'note',
    accent: 'var(--haven-quick-add-note-accent)',
    chip: 'var(--haven-quick-add-note-chip)',
  },
];
