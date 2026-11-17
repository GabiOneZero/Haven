import { inject, Injectable } from '@angular/core';

import { SupabaseService } from './supabase.service';

export interface WorkspaceMemberMood {
  userId: string;
  displayName: string;
  mood: string | null;
  color?: string | null;
  bgColor?: string | null;
}

interface WorkspaceMemberProfile {
  displayName: string;
  grammaticalGender: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class MoodService {
  private readonly supabaseService = inject(SupabaseService);

  async getCurrentWorkspaceMoods(): Promise<[WorkspaceMemberMood, WorkspaceMemberMood]> {
    try {
      const currentUserId = await this.getAuthenticatedUserId();
      const workspaceId = await this.getCurrentWorkspaceId(currentUserId);
      const memberIds = await this.getWorkspaceMemberIds(workspaceId, currentUserId);
      const memberProfiles = await this.getMemberProfiles(memberIds);

      const [currentUserMood, partnerMood] = await Promise.all(
        memberIds.map((userId) => this.getMemberMood(workspaceId, userId, memberProfiles)),
      );
      return [currentUserMood, partnerMood];
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }

      const message =
        typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'Error inesperado al obtener los estados de ánimo del workspace.';
      throw new Error(message, { cause: error });
    }
  }

  private async getAuthenticatedUserId(): Promise<string> {
    const { data, error } = await this.supabaseService.client.auth.getUser();

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('No hay una sesión autenticada de Supabase.');
    }

    return data.user.id;
  }

  private async getCurrentWorkspaceId(userId: string): Promise<string> {
    const { data: memberships, error } = await this.supabaseService.client
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    const workspaceIds = [...new Set((memberships ?? []).map(({ workspace_id }) => workspace_id))];

    if (workspaceIds.length !== 1) {
      throw new Error(`Se esperaba un workspace para el usuario y se encontraron ${workspaceIds.length}.`);
    }

    return workspaceIds[0];
  }

  private async getWorkspaceMemberIds(workspaceId: string, currentUserId: string): Promise<[string, string]> {
    const { data: workspaceMembers, error } = await this.supabaseService.client
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspaceId)
      .order('joined_at', { ascending: true });

    if (error) {
      throw error;
    }

    const memberIds = [...new Set((workspaceMembers ?? []).map(({ user_id }) => user_id))];

    if (memberIds.length !== 2 || !memberIds.includes(currentUserId)) {
      throw new Error(`La tarjeta necesita dos miembros en el workspace; se encontraron ${memberIds.length}.`);
    }

    const partnerId = memberIds.find((userId) => userId !== currentUserId);

    if (!partnerId) {
      throw new Error('No se encontró el otro miembro del workspace.');
    }

    return [currentUserId, partnerId];
  }

  private async getMemberProfiles(memberIds: readonly [string, string]): Promise<Map<string, WorkspaceMemberProfile>> {
    const { data: profiles, error } = await this.supabaseService.client
      .from('profiles')
      .select('id,display_name,grammatical_gender')
      .in('id', memberIds);

    if (error) {
      throw error;
    }

    return new Map(
      (profiles ?? []).map(({ id, display_name, grammatical_gender }) => [
        id,
        { displayName: display_name, grammaticalGender: grammatical_gender },
      ]),
    );
  }

  private async getMemberMood(
    workspaceId: string,
    userId: string,
    memberProfiles: ReadonlyMap<string, WorkspaceMemberProfile>,
  ): Promise<WorkspaceMemberMood> {
    const profile = memberProfiles.get(userId);

    if (!profile) {
      throw new Error(`No se encontró el perfil del usuario ${userId}.`);
    }

    const { data: moodRecord, error } = await this.supabaseService.client
      .from('moods')
      .select(
        'id,mood_id,created_at,mood_catalog(color,bg_color,mood_translations(name_masculine,name_feminine,locale))',
      )
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .eq('mood_catalog.mood_translations.locale', 'es')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (moodRecord?.mood_id) {
      const moodCatalogRelation = moodRecord.mood_catalog;
      const moodCatalog = Array.isArray(moodCatalogRelation) ? moodCatalogRelation[0] : moodCatalogRelation;
      const translation = moodCatalog?.mood_translations?.[0];

      if (!moodCatalog || !translation) {
        throw new Error(`No se encontró el mood o su traducción en español para el usuario ${userId}.`);
      }

      if (profile.grammaticalGender !== 'masculine' && profile.grammaticalGender !== 'feminine') {
        throw new Error(`El perfil del usuario ${userId} no tiene un género gramatical válido.`);
      }

      return {
        userId,
        displayName: profile.displayName,
        mood: profile.grammaticalGender === 'masculine' ? translation.name_masculine : translation.name_feminine,
        color: moodCatalog.color,
        bgColor: moodCatalog.bg_color,
      };
    }

    return {
      userId,
      displayName: profile.displayName,
      mood: moodRecord && 'mood' in moodRecord && typeof moodRecord.mood === 'string' ? moodRecord.mood : null,
    };
  }
}
