import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://klocxiemfsdorcjylbeg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsb2N4aWVtZnNkb3JjanlsYmVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODYwMzgsImV4cCI6MjA3NTM2MjAzOH0.iS-y9jIOA86tagkQZeGYqzABI5F059TcWLmk9vt1_bM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database service functions
export const DatabaseService = {
  // Create or update student progress
  updateStudentProgress: async (userId, levelGroup, stage, isCorrect, timeRemaining) => {
    try {
      // First, get current progress
      const { data: currentProgress, error: fetchError } = await supabase
        .from('student_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('level_group', levelGroup)
        .single();

      const now = new Date().toISOString();
      let progressData;

      if (currentProgress) {
        // Update existing progress
        const totalAttempts = currentProgress.total_attempts + 1;
        const correctAnswers = currentProgress.correct_answers + (isCorrect ? 1 : 0);
        const accuracy = Math.round((correctAnswers / totalAttempts) * 100);
        
        // Calculate completion rate (stages completed / 4 * 100)
        const completedStages = Math.max(currentProgress.completed_stages, stage - 1 + (isCorrect ? 1 : 0));
        const completionRate = Math.round((completedStages / 4) * 100);
        
        progressData = {
          completed_stages: completedStages,
          total_attempts: totalAttempts,
          correct_answers: correctAnswers,
          accuracy: accuracy,
          completion_rate: completionRate,
          last_played: now,
          current_stage: Math.max(currentProgress.current_stage, stage)
        };

        const { error: updateError } = await supabase
          .from('student_progress')
          .update(progressData)
          .eq('user_id', userId)
          .eq('level_group', levelGroup);

        if (updateError) throw updateError;
      } else {
        // Create new progress record
        const accuracy = isCorrect ? 100 : 0;
        const completedStages = isCorrect ? 1 : 0;
        const completionRate = Math.round((completedStages / 4) * 100);

        progressData = {
          user_id: userId,
          level_group: levelGroup,
          completed_stages: completedStages,
          current_stage: stage,
          total_attempts: 1,
          correct_answers: isCorrect ? 1 : 0,
          accuracy: accuracy,
          completion_rate: completionRate,
          created_at: now,
          last_played: now
        };

        const { error: insertError } = await supabase
          .from('student_progress')
          .insert([progressData]);

        if (insertError) throw insertError;
      }

      // Also record individual quiz attempt
      const { error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert([{
          user_id: userId,
          level_group: levelGroup,
          stage: stage,
          is_correct: isCorrect,
          time_remaining: timeRemaining,
          attempt_date: now
        }]);

      if (attemptError) throw attemptError;

      return progressData;
    } catch (error) {
      console.error('Error updating student progress:', error);
      throw error;
    }
  },

  // Get student progress for all levels
  getStudentProgress: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('student_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
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

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all students progress:', error);
      return [];
    }
  }
};