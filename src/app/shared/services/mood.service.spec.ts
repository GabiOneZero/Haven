import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MoodService } from './mood.service';
import { SupabaseService } from './supabase.service';

interface QueryResponse {
  data: unknown;
  error: null;
}

interface QueryOperation {
  method: string;
  args: unknown[];
}

interface QueryTrace {
  table: string;
  operations: QueryOperation[];
}

class MockQueryBuilder extends Promise<QueryResponse> {
  static override get [Symbol.species](): PromiseConstructor {
    return Promise;
  }

  constructor(
    private readonly response: QueryResponse,
    private readonly trace: QueryTrace,
  ) {
    super((resolve) => resolve(response));
  }

  select(columns: string): this {
    this.trace.operations.push({ method: 'select', args: [columns] });
    return this;
  }

  eq(column: string, value: string): this {
    this.trace.operations.push({ method: 'eq', args: [column, value] });
    return this;
  }

  in(column: string, values: readonly string[]): this {
    this.trace.operations.push({ method: 'in', args: [column, values] });
    return this;
  }

  order(column: string, options: { ascending: boolean }): this {
    this.trace.operations.push({ method: 'order', args: [column, options] });
    return this;
  }

  limit(count: number): this {
    this.trace.operations.push({ method: 'limit', args: [count] });
    return this;
  }

  maybeSingle(): Promise<QueryResponse> {
    this.trace.operations.push({ method: 'maybeSingle', args: [] });
    return Promise.resolve(this.response);
  }
}

function createSupabaseMock(userId: string | null = 'user-1') {
  const traces: QueryTrace[] = [];
  let workspaceMembersQuery = 0;
  let moodQuery = 0;

  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      let data: unknown;

      if (table === 'workspace_members') {
        workspaceMembersQuery += 1;
        data =
          workspaceMembersQuery === 1
            ? [{ workspace_id: 'workspace-1' }]
            : [{ user_id: 'user-2' }, { user_id: 'user-1' }];
      } else if (table === 'profiles') {
        data = [
          { id: 'user-2', display_name: 'Aldara' },
          { id: 'user-1', display_name: 'Gabi' },
        ];
      } else {
        moodQuery += 1;
        data =
          moodQuery === 1
            ? { id: 'mood-1', mood: 'Con energía', created_at: '2026-11-10T10:00:00Z' }
            : { id: 'mood-2', mood: 'En calma', created_at: '2026-11-10T11:00:00Z' };
      }

      const trace = { table, operations: [] };
      traces.push(trace);

      return new MockQueryBuilder({ data, error: null }, trace);
    }),
  };

  return { client, traces };
}

describe('MoodService', () => {
  let service: MoodService;
  let supabaseMock: ReturnType<typeof createSupabaseMock>;

  beforeEach(() => {
    supabaseMock = createSupabaseMock();
    TestBed.configureTestingModule({
      providers: [
        MoodService,
        {
          provide: SupabaseService,
          useValue: { client: supabaseMock.client },
        },
      ],
    });
    service = TestBed.inject(MoodService);
  });

  it('returns the authenticated user and their workspace member moods', async () => {
    const moods = await service.getCurrentWorkspaceMoods();

    expect(moods).toEqual([
      { userId: 'user-1', displayName: 'Gabi', mood: 'Con energía' },
      { userId: 'user-2', displayName: 'Aldara', mood: 'En calma' },
    ]);

    const moodQueries = supabaseMock.traces.filter(({ table }) => table === 'moods');
    expect(moodQueries).toHaveLength(2);

    for (const query of moodQueries) {
      expect(query.operations).toContainEqual({
        method: 'order',
        args: ['created_at', { ascending: false }],
      });
      expect(query.operations).toContainEqual({ method: 'limit', args: [1] });
    }
  });

  it('rejects when there is no authenticated user', async () => {
    supabaseMock = createSupabaseMock(null);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        MoodService,
        {
          provide: SupabaseService,
          useValue: { client: supabaseMock.client },
        },
      ],
    });
    service = TestBed.inject(MoodService);

    await expect(service.getCurrentWorkspaceMoods()).rejects.toThrow('No hay una sesión autenticada de Supabase.');
    expect(supabaseMock.client.from).not.toHaveBeenCalled();
  });
});
