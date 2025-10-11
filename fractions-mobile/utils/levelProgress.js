import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseService } from '../supabase';

const LEVEL_PROGRESS_KEY = 'levelProgress';
const USER_ID_KEY = 'userId';

export const LevelProgress = {
  // Get current user ID
  getCurrentUserId: async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || user.username; // Use ID if available, fallback to username
      }
      return null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  },

  // Get progress for all level groups (now from Supabase)
  getAllProgress: async () => {
    try {
      const userId = await LevelProgress.getCurrentUserId();
      if (!userId) {
        return { level1: [1], level2: [], level3: [] };
      }

      const progressData = await DatabaseService.getStudentProgress(userId);
      
      // Convert Supabase data to local format
      const localFormat = { level1: [1], level2: [], level3: [] };
      
      progressData.forEach(progress => {
        const levelKey = `level${progress.level_group}`;
        const unlockedStages = [];
        
        // Add unlocked stages based on completed stages
        for (let i = 1; i <= Math.min(progress.current_stage + 1, 4); i++) {
          unlockedStages.push(i);
        }
        
        localFormat[levelKey] = unlockedStages;
      });

      return localFormat;
    } catch (error) {
      console.error('Error getting all progress:', error);
      return { level1: [1], level2: [], level3: [] };
    }
  },

  // Get completed levels for a specific level group
  getCompletedLevels: async (levelGroup = 1) => {
    try {
      const allProgress = await LevelProgress.getAllProgress();
      return allProgress[`level${levelGroup}`] || (levelGroup === 1 ? [1] : []);
    } catch (error) {
      console.error('Error getting level progress:', error);
      return levelGroup === 1 ? [1] : [];
    }
  },

  // Complete a stage and update Supabase
  completeLevel: async (stage, levelGroup = 1, isCorrect = true, timeRemaining = 0) => {
    try {
      console.log('🎯 COMPLETING STAGE:', stage, 'in level group:', levelGroup, 'Correct:', isCorrect);
      
      const userId = await LevelProgress.getCurrentUserId();
      if (!userId) {
        console.error('No user ID found');
        return await LevelProgress.getAllProgress();
      }

      // Update progress in Supabase
      const progressData = await DatabaseService.updateStudentProgress(
        userId, 
        levelGroup, 
        stage, 
        isCorrect, 
        timeRemaining
      );

      console.log('✅ Progress updated in Supabase:', progressData);

      // Also update local storage for offline access
      const allProgress = await LevelProgress.getAllProgress();
      const currentLevelKey = `level${levelGroup}`;
      let currentLevelProgress = [...(allProgress[currentLevelKey] || [])];
      
      // Ensure stage 1 is in the array for level 1
      if (levelGroup === 1 && !currentLevelProgress.includes(1)) {
        currentLevelProgress.push(1);
      }
      
      // Add current stage to completed if correct and not already there
      if (isCorrect && !currentLevelProgress.includes(stage)) {
        currentLevelProgress.push(stage);
      }
      
      // Unlock next stage within the same level (up to 4 stages)
      const nextStage = stage + 1;
      if (isCorrect && !currentLevelProgress.includes(nextStage) && nextStage <= 4) {
        currentLevelProgress.push(nextStage);
      }
      
      // Sort the array to keep it in order
      currentLevelProgress.sort((a, b) => a - b);
      
      // Update the progress
      allProgress[currentLevelKey] = currentLevelProgress;
      
      // If completed all 4 stages of current level, unlock first stage of next level
      const hasAllStages = [1, 2, 3, 4].every(s => currentLevelProgress.includes(s));
      if (hasAllStages && levelGroup < 3) {
        const nextLevelKey = `level${levelGroup + 1}`;
        if (!allProgress[nextLevelKey] || allProgress[nextLevelKey].length === 0) {
          allProgress[nextLevelKey] = [1];
          console.log('🚀 Unlocked level group:', levelGroup + 1);
        }
      }
      
      // Save to local storage
      await AsyncStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(allProgress));
      
      return allProgress;
    } catch (error) {
      console.error('❌ Error completing level:', error);
      return await LevelProgress.getAllProgress();
    }
  },

  // Check if a stage is unlocked within a level group
  isLevelUnlocked: (stage, completedLevels) => {
    return completedLevels.includes(stage);
  },

  // Reset all progress
  resetProgress: async () => {
    try {
      const initialProgress = { level1: [1], level2: [], level3: [] };
      await AsyncStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(initialProgress));
      console.log('🔄 Progress reset to:', initialProgress);
      return initialProgress;
    } catch (error) {
      console.error('Error resetting progress:', error);
    }
  }
};