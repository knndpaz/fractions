// Only import polyfill in React Native environment
if (typeof window === 'undefined') {
  require('react-native-url-polyfill/auto');
}

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://klocxiemfsdorcjylbeg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsb2N4aWVtZnNkb3JjanlsYmVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODYwMzgsImV4cCI6MjA3NTM2MjAzOH0.iS-y9jIOA86tagkQZeGYqzABI5F059TcWLmk9vt1_bM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper: ensure a profile row exists in public.users for the current auth user
async function ensureUserProfileExists(explicitUserId) {
  try {
    // Prefer current session user; fallback to explicitUserId
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    const userId = user?.id || explicitUserId;
    if (!userId) return null;

    // Check if profile exists
    const { data: existing, error: selErr } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (selErr) {
      console.warn('users select error (ignored):', selErr);
    }
    if (existing) return existing;

    // Build profile from metadata
    const md = user?.user_metadata || {};
    const username =
      (md.username || (user?.email ? user.email.split('@')[0] : 'user')).toLowerCase();
    const full_name = md.full_name || user?.email || 'Student';
    const section = md.section || 'Default';

    // Insert profile (will pass RLS if auth.uid() = id)
    const { data: created, error: insErr } = await supabase
      .from('users')
      .insert([{ id: userId, username, full_name, section }])
      .select('id')
      .single();

    if (insErr) {
      // Ignore duplicate profile (23505)
      if (insErr.code !== '23505') {
        console.warn('users insert error:', insErr);
        return null;
      }
    }
    return created || { id: userId };
  } catch (e) {
    console.warn('ensureUserProfileExists failed:', e);
    return null;
  }
}

// Database service functions
export const DatabaseService = {
  // Create or update student progress
  updateStudentProgress: async (userId, levelGroup, stage, isCorrect, timeRemaining) => {
    try {
      console.log('📊 Updating progress for user:', userId, 'Level:', levelGroup, 'Stage:', stage, 'Correct:', isCorrect);

      // Make sure a profile row exists to satisfy FK (public.users.id)
      await ensureUserProfileExists(userId);

      // First, get current progress
      const { data: currentProgress, error: fetchError } = await supabase
        .from('student_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('level_group', levelGroup)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching current progress:', fetchError);
        throw fetchError;
      }

      const now = new Date().toISOString();
      let progressData;

      if (currentProgress) {
        console.log('📊 Found existing progress:', currentProgress);

        const totalAttempts = currentProgress.total_attempts + 1;
        const correctAnswers = currentProgress.correct_answers + (isCorrect ? 1 : 0);
        const accuracy = Math.round((correctAnswers / totalAttempts) * 100);

        const completedStages = Math.max(
          currentProgress.completed_stages,
          isCorrect ? stage : currentProgress.completed_stages
        );
        const completionRate = Math.round((completedStages / 4) * 100);

        progressData = {
          completed_stages: completedStages,
          total_attempts: totalAttempts,
          correct_answers: correctAnswers,
          accuracy,
          completion_rate: completionRate,
          last_played: now,
          current_stage: Math.max(currentProgress.current_stage, stage),
        };

        const { error: updateError } = await supabase
          .from('student_progress')
          .update(progressData)
          .eq('user_id', userId)
          .eq('level_group', levelGroup);

        if (updateError) {
          console.error('Error updating progress:', updateError);
          throw updateError;
        }
      } else {
        console.log('📊 Creating new progress record');

        const accuracy = isCorrect ? 100 : 0;
        const completedStages = isCorrect ? stage : 0;
        const completionRate = Math.round((completedStages / 4) * 100);

        progressData = {
          user_id: userId,
          level_group: levelGroup,
          completed_stages: completedStages,
          current_stage: stage,
          total_attempts: 1,
          correct_answers: isCorrect ? 1 : 0,
          accuracy,
          completion_rate: completionRate,
          created_at: now,
          last_played: now,
        };

        console.log('📊 Upserting new data:', progressData);

        // Use upsert to avoid 409 on unique (user_id, level_group)
        const { error: insertError } = await supabase
          .from('student_progress')
          .upsert([progressData], { onConflict: 'user_id,level_group' });

        if (insertError) {
          console.error('Error inserting progress:', insertError);
          throw insertError;
        }
      }

      // Also record individual quiz attempt (best-effort)
      const attemptData = {
        user_id: userId,
        level_group: levelGroup,
        stage,
        is_correct: isCorrect,
        time_remaining: timeRemaining,
        attempt_date: now,
      };

      const { error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert([attemptData]);

      if (attemptError) {
        console.error('Error recording quiz attempt:', attemptError);
      }

      console.log('✅ Progress updated successfully');
      return progressData;
    } catch (error) {
      const msg = String(error?.message || '');
      const code = error?.code || '';
      if (code === '42P01' || /does not exist/i.test(msg)) {
        console.warn('Student progress tables missing. Create public.student_progress and public.quiz_attempts.');
      }
      console.error('❌ Error updating student progress:', error);
      throw error;
    }
  },

  // Get student progress for all levels
  getStudentProgress: async (userId) => {
    try {
      console.log('📊 Fetching progress for user:', userId);
      
      const { data, error } = await supabase
        .from('student_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching student progress:', error);
        throw error;
      }
      
      console.log('📊 Fetched progress data:', data);
      return data || [];
    } catch (error) {
      const msg = String(error?.message || '');
      if (error?.code === '42P01' || /student_progress.*does not exist/i.test(msg)) {
        console.warn('Table public.student_progress not found. Create it in Supabase (see migration SQL).');
      }
      console.error('Error fetching student progress:', error);
      return [];
    }
  },

  // Get all students with their progress (for reports)
  getAllStudentsProgress: async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          full_name,
          section,
          student_progress (
            level_group,
            completed_stages,
            current_stage,
            total_attempts,
            correct_answers,
            accuracy,
            completion_rate,
            last_played
          )
        `);

      if (error) {
        console.error('Error fetching all students progress:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching all students progress:', error);
      return [];
    }
  },

  // Get a specific student's progress (for reports)
  getStudentProgressById: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          full_name,
          section,
          student_progress (
            level_group,
            completed_stages,
            current_stage,
            total_attempts,
            correct_answers,
            accuracy,
            completion_rate,
            last_played
          )
        `)
        .eq('id', userId);

      if (error) {
        console.error('Error fetching student progress by ID:', error);
        throw error;
      }

      return data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error fetching student progress by ID:', error);
      return null;
    }
  },

  // Get leaderboard data
  getLeaderboard: async (limit = 10) => {
    try {
      const { data, error } = await supabase
        .from('student_progress')
        .select(`
          user_id,
          level_group,
          completed_stages,
          current_stage,
          total_attempts,
          correct_answers,
          accuracy,
          completion_rate,
          last_played,
          users (
            username,
            full_name
          )
        `)
        .order('completion_rate', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching leaderboard data:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      return [];
    }
  },

  // Get quiz attempts for a user
  getQuizAttempts: async (userId, levelGroup, stage) => {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          id,
          user_id,
          level_group,
          stage,
          is_correct,
          time_remaining,
          attempt_date
        `)
        .eq('user_id', userId)
        .eq('level_group', levelGroup)
        .eq('stage', stage)
        .order('attempt_date', { ascending: false });

      if (error) {
        console.error('Error fetching quiz attempts:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching quiz attempts:', error);
      return [];
    }
  },

  // Get all levels and stages for a user
  getUserLevelsAndStages: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('student_progress')
        .select(`
          level_group,
          completed_stages,
          current_stage
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user levels and stages:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user levels and stages:', error);
      return [];
    }
  },

  // Reset student progress (for testing)
  resetStudentProgress: async (userId) => {
    try {
      console.log('⏪ Resetting progress for user:', userId);

      const { error } = await supabase
        .from('student_progress')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error resetting progress:', error);
        throw error;
      }

      console.log('✅ Progress reset successfully');
    } catch (error) {
      console.error('Error resetting progress:', error);
    }
  },

  // Reset progress to initial state (DB-first, no delete policy required)
  clearStudentProgress: async (userId, levelGroup) => {
    if (!userId) return { ok: false, reason: 'missing userId' };
    const now = new Date().toISOString();

    // Build zeroed payloads
    const makeRow = (g) => ({
      user_id: userId,
      level_group: g,
      completed_stages: 0,
      current_stage: 1,
      total_attempts: 0,
      correct_answers: 0,
      accuracy: 0,
      completion_rate: 0,
      last_played: now,
      created_at: now,
    });

    try {
      const groups = typeof levelGroup === 'number' ? [levelGroup] : [1, 2, 3];

      // Upsert zeroed rows to avoid 409/permissions on delete
      const payload = groups.map(makeRow);
      const { error: upsertErr } = await supabase
        .from('student_progress')
        .upsert(payload, { onConflict: 'user_id,level_group' });

      if (upsertErr) {
        console.warn('clearStudentProgress upsert error:', upsertErr);
      }

      // Best-effort delete quiz attempts (ignore RLS errors)
      try {
        let q = supabase.from('quiz_attempts').delete().eq('user_id', userId);
        if (typeof levelGroup === 'number') {
          q = q.eq('level_group', levelGroup);
        }
        await q;
      } catch (e) {
        // Ignore delete failures (likely due to RLS)
      }

      return { ok: !upsertErr, error: upsertErr || null };
    } catch (e) {
      return { ok: false, error: e };
    }
  },

  // Debug: Get raw data from a table
  debugGetTableData: async (tableName) => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) {
        console.error(`Error fetching data from ${tableName}:`, error);
        throw error;
      }

      console.log(`📊 Fetched data from ${tableName}:`, data);
      return data || [];
    } catch (error) {
      console.error(`Error fetching data from ${tableName}:`, error);
      return [];
    }
  }
};