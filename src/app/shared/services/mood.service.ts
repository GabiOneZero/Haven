import { inject, Injectable } from '@angular/core';

import { SupabaseService } from './supabase.service';

export interface WorkspaceMemberMood {
  userId: string;
  displayName: string;
  mood: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class MoodService {
  private supabaseService = inject(SupabaseService);

  async getCurrentWorkspaceMoods(): Promise<[WorkspaceMemberMood, WorkspaceMemberMood]> {
    const supabase = this.supabaseService.client;
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      throw authError;
    }

    const currentUser = authData.user;

    if (!currentUser) {
      throw new Error('No hay una sesión autenticada de Supabase.');
    }

    const { data: memberships, error: membershipsError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', currentUser.id);

    if (membershipsError) {
      throw membershipsError;
    }

    const workspaceIds = [...new Set((memberships ?? []).map(({ workspace_id }) => workspace_id))];

    if (workspaceIds.length !== 1) {
      throw new Error(`Se esperaba un workspace para el usuario y se encontraron ${workspaceIds.length}.`);
    }

    const workspaceId = workspaceIds[0];
    const { data: workspaceMembers, error: workspaceMembersError } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspaceId)
      .order('joined_at', { ascending: true });

    if (workspaceMembersError) {
      throw workspaceMembersError;
    }

    const memberIds = [...new Set((workspaceMembers ?? []).map(({ user_id }) => user_id))];

    if (memberIds.length !== 2 || !memberIds.includes(currentUser.id)) {
      throw new Error(`La tarjeta necesita dos miembros en el workspace; se encontraron ${memberIds.length}.`);
    }

    const partnerId = memberIds.find((userId) => userId !== currentUser.id);

    if (!partnerId) {
      throw new Error('No se encontró el otro miembro del workspace.');
    }

    const memberIdsInCardOrder = [currentUser.id, partnerId] as const;
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id,display_name')
      .in('id', memberIdsInCardOrder);

    if (profilesError) {
      throw profilesError;
    }

    const displayNames = new Map((profiles ?? []).map(({ id, display_name }) => [id, display_name]));

    const [currentUserMood, partnerMood] = await Promise.all(
      memberIdsInCardOrder.map(async (userId) => {
        const displayName = displayNames.get(userId);

        if (displayName === undefined) {
          throw new Error(`No se encontró el perfil del usuario ${userId}.`);
        }

        const { data: moodRecord, error: moodError } = await supabase
          .from('moods')
          .select('id,mood,created_at')
          .eq('workspace_id', workspaceId)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (moodError) {
          throw moodError;
        }

        return {
          userId,
          displayName,
          mood: moodRecord?.mood ?? null,
        };
      }),
    );

    return [currentUserMood, partnerMood];
  }
}
