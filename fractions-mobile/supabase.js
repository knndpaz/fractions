// Only import polyfill in React Native environment
if (typeof window === 'undefined') {
  require('react-native-url-polyfill/auto');
}

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://klocxiemfsdorcjylbeg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsb2N4aWVtZnNkb3JjanlsYmVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NzY4NDYsImV4cCI6MjA1MTI1Mjg0Nn0.XGaL6Wd5-3OGgHJIbvt52Qk3QhOvM2tZlDxL7_JjEJk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database service functions
export const DatabaseService = {
  // Create or update student progress
  updateStudentProgress: async (userId, levelGroup, stage, isCorrect, timeRemaining) => {
    try {
      console.log('📊 Updating progress for user:', userId, 'Level:', levelGroup, 'Stage:', stage, 'Correct:', isCorrect);
      
      // First, get current progress
      const { data: currentProgress, error: fetchError } = await supabase
        .from('student_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('level_group', levelGroup)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching current progress:', fetchError);
        throw fetchError;
      }

      const now = new Date().toISOString();
      let progressData;

      if (currentProgress) {
        console.log('📊 Found existing progress:', currentProgress);
        
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

        console.log('📊 Updating with data:', progressData);

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

        console.log('📊 Inserting new data:', progressData);

        const { error: insertError } = await supabase
          .from('student_progress')
          .insert([progressData]);

        if (insertError) {
          console.error('Error inserting progress:', insertError);
          throw insertError;
        }
      }

      // Also record individual quiz attempt
      const attemptData = {
        user_id: userId,
        level_group: levelGroup,
        stage: stage,
        is_correct: isCorrect,
        time_remaining: timeRemaining,
        attempt_date: now
      };

      console.log('📊 Recording quiz attempt:', attemptData);

      const { error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert([attemptData]);

      if (attemptError) {
        console.error('Error recording quiz attempt:', attemptError);
        // Don't throw here - attempt recording is secondary
      }

      console.log('✅ Progress updated successfully');
      return progressData;
    } catch (error) {
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
  },

  // Test connection to database
  testConnection: async () => {
    try {
      console.log('🧪 Testing database connection...');
      const { data, error } = await supabase
        .from('users')
        .select('count(*)')
        .limit(1);

      if (error) {
        console.error('❌ Database connection failed:', error);
        return false;
      }
      
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      return false;
    }
  }
};