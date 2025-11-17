import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, DatabaseService } from '../supabase';

const LEVEL_PROGRESS_KEY = 'levelProgress';
const BASELINE_PROGRESS = { level1: [1], level2: [], level3: [] };
const USER_ID_KEY = 'userId'; // FIX: missing constant

// Configure how many stages exist per level group
const stagesPerLevel = {
  1: 2,
  2: 2,
  3: 2,
};
const MAX_STAGE = 2; // Keep for backward compatibility, but use stagesPerLevel where possible

// Helper to safely compute percentage
const toPct = (num, den) => {
  if (!den || den <= 0) return 0;
  return Math.round((num / den) * 100);
};

// Small helpers
const uniqSorted = (arr) => Array.from(new Set(arr)).sort((a, b) => a - b);
const clampStage = (s) => Math.max(1, Math.min(MAX_STAGE, Number(s) || 1));

export const LevelProgress = {
  // Ensure we can get the current auth user id
  getCurrentUserId: async () => {
    try {
      const { data } = await supabase.auth.getUser();
      return data?.user?.id || (await AsyncStorage.getItem(USER_ID_KEY));
    } catch {
      return await AsyncStorage.getItem(USER_ID_KEY);
    }
  },

  // Get all progress from Supabase (database-first approach)
  getAllProgress: async () => {
    try {
      const userId = await LevelProgress.getCurrentUserId();
      
      if (!userId || !DatabaseService?.getStudentProgress) {
        // Fallback to local storage if no user or DB not available
        const raw = await AsyncStorage.getItem(LEVEL_PROGRESS_KEY);
        if (!raw) {
          return BASELINE_PROGRESS;
        }
        const parsed = JSON.parse(raw);
        return {
          level1: Array.isArray(parsed.level1) ? parsed.level1 : [1],
          level2: Array.isArray(parsed.level2) ? parsed.level2 : [],
          level3: Array.isArray(parsed.level3) ? parsed.level3 : [],
        };
      }

      // Fetch from database
      const rows = await DatabaseService.getStudentProgress(userId);
      const progress = { level1: [1], level2: [], level3: [] };

      rows.forEach(row => {
        const lg = Number(row.level_group);
        if (lg >= 1 && lg <= 3) {
          const currentStage = Math.max(1, Math.min(stagesPerLevel[lg], Number(row.current_stage || 1)));
          const completedStages = Math.max(0, Math.min(stagesPerLevel[lg], Number(row.completed_stages || 0)));
          
          const unlocked = new Set();
          // Add all stages up to current
          for (let s = 1; s <= currentStage; s++) {
            unlocked.add(s);
          }
          // Add completion marker if fully completed
          if (completedStages >= stagesPerLevel[lg]) {
            unlocked.add(stagesPerLevel[lg] + 1);
          }
          
          progress[`level${lg}`] = Array.from(unlocked).sort((a, b) => a - b);
        }
      });

      // Cache locally for offline access
      await AsyncStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(progress));
      return progress;
    } catch (e) {
      console.warn('getAllProgress DB error, falling back to local:', e);
      // Fallback to local storage
      const raw = await AsyncStorage.getItem(LEVEL_PROGRESS_KEY);
      if (!raw) {
        return BASELINE_PROGRESS;
      }
      const parsed = JSON.parse(raw);
      return {
        level1: Array.isArray(parsed.level1) ? parsed.level1 : [1],
        level2: Array.isArray(parsed.level2) ? parsed.level2 : [],
        level3: Array.isArray(parsed.level3) ? parsed.level3 : [],
      };
    }
  },

  // Persist local progress (cache only)
  setAllProgress: async (obj) => {
    await AsyncStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(obj));
  },

  // Reset progress (DB + local). If levelGroup provided, only reset that group.
  resetProgress: async (levelGroup) => {
    try {
      const userId = await LevelProgress.getCurrentUserId();
      const lg = Number(levelGroup);
      const isValidGroup = Number.isInteger(lg) && lg >= 1 && lg <= 3;

      // Reset in database first
      if (userId && DatabaseService?.clearStudentProgress) {
        try {
          await DatabaseService.clearStudentProgress(userId, isValidGroup ? lg : undefined);
          console.log('[LevelProgress] Database reset successful');
        } catch (e) {
          console.warn('[LevelProgress] Database reset failed:', e);
        }
      }

      // Reset local cache
      const current = await LevelProgress.getAllProgress();
      let next = { ...current };

      if (isValidGroup) {
        next[`level${lg}`] = lg === 1 ? [1] : [];
      } else {
        next = { ...BASELINE_PROGRESS };
      }

      await AsyncStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(next));
      
      // Clear local answer stats
      for (let levelGroup = 1; levelGroup <= 3; levelGroup++) {
        for (let stage = 1; stage <= 2; stage++) {
          await AsyncStorage.removeItem(`@answer_stats_${levelGroup}_${stage}`);
        }
      }

      return next;
    } catch (e) {
      console.error('[LevelProgress] Reset failed:', e);
      return { ...BASELINE_PROGRESS };
    }
  },

  // Get completed levels from Supabase (database-first)
  getCompletedLevels: async (levelGroup = 1) => {
    try {
      const lg = Number(levelGroup) || 1;
      const userId = await LevelProgress.getCurrentUserId();

      if (!userId || !DatabaseService?.getStudentProgress) {
        // Fallback to local storage
        const raw = await AsyncStorage.getItem(LEVEL_PROGRESS_KEY);
        const all = raw ? JSON.parse(raw) : { level1: [1], level2: [], level3: [] };
        const localArr = Array.isArray(all[`level${lg}`]) ? all[`level${lg}`] : [];
        return lg === 1 ? uniqSorted(localArr.includes(1) ? localArr : [1, ...localArr]) : uniqSorted(localArr);
      }

      // Fetch from database
      const rows = await DatabaseService.getStudentProgress(userId);
      const row = Array.isArray(rows) ? rows.find(r => Number(r.level_group) === lg) : null;

      if (!row) {
        // No progress record for this level yet
        if (lg === 1) {
          // Level 1 always has stage 1 unlocked
          return [1];
        } else {
          // Check if previous level is completed
          const prevRows = rows.find(r => Number(r.level_group) === lg - 1);
          if (!prevRows || Number(prevRows.completed_stages) < stagesPerLevel[lg - 1]) {
            return []; // Previous level not completed, this level is locked
          }
          return [1]; // Previous level completed, unlock stage 1
        }
      }

      // Build unlocked stages from database record
      const currentStage = Math.max(1, Math.min(stagesPerLevel[lg], Number(row.current_stage || 1)));
      const completedStages = Math.max(0, Math.min(stagesPerLevel[lg], Number(row.completed_stages || 0)));
      
      const unlocked = new Set();
      
      // Add all stages up to current
      for (let s = 1; s <= currentStage; s++) {
        unlocked.add(s);
      }
      
      // Add all completed stages
      for (let s = 1; s <= completedStages; s++) {
        unlocked.add(s);
      }
      
      // If all stages completed, add completion marker
      if (completedStages >= stagesPerLevel[lg]) {
        unlocked.add(stagesPerLevel[lg] + 1);
      }

      // Ensure progression: for levels > 1, don't unlock if previous level not completed
      if (lg > 1) {
        const prevRow = rows.find(r => Number(r.level_group) === lg - 1);
        if (!prevRow || Number(prevRow.completed_stages) < stagesPerLevel[lg - 1]) {
          unlocked.clear();
          return [];
        }
      }

      const result = uniqSorted(Array.from(unlocked));

      // Cache locally
      const all = await LevelProgress.getAllProgress();
      all[`level${lg}`] = result;
      await AsyncStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(all));

      return result;
    } catch (e) {
      console.warn('[LevelProgress] getCompletedLevels DB error, falling back to local:', e);
      // Fallback to local storage
      const raw = await AsyncStorage.getItem(LEVEL_PROGRESS_KEY);
      const all = raw ? JSON.parse(raw) : { level1: [1], level2: [], level3: [] };
      const localArr = Array.isArray(all[`level${lg}`]) ? all[`level${lg}`] : [];
      return lg === 1 ? uniqSorted(localArr.includes(1) ? localArr : [1, ...localArr]) : uniqSorted(localArr);
    }
  },

  isLevelUnlocked: (stage, unlockedList) => {
    return Array.isArray(unlockedList) && unlockedList.includes(stage);
  },

  // New: compute completion percentage for a level group (DB-first)
  getCompletionPercentage: async (levelGroup) => {
    try {
      const userId = await LevelProgress.getCurrentUserId();

      // If levelGroup is specified, get percentage for that level only
      if (levelGroup) {
        const lg = Number(levelGroup);
        if (userId && DatabaseService?.getStudentProgress) {
          try {
            const rows = await DatabaseService.getStudentProgress(userId);
            const row = rows?.find(r => Number(r.level_group) === lg);
            if (row) {
              const pct = Number(row.completion_rate);
              if (!Number.isNaN(pct) && pct >= 0) return pct;
              const completed = Number(row.completed_stages ?? 0);
              return Math.round((Math.min(stagesPerLevel[lg], Math.max(0, completed)) / stagesPerLevel[lg]) * 100);
            }
          } catch {
            // fall through to local
          }
        }

        // Local fallback
        const all = await LevelProgress.getAllProgress();
        const arr = all[`level${lg}`] || [];
        const maxUnlocked = arr.length ? Math.max(...arr) : 1;
        const completedLocal = Math.max(0, Math.min(stagesPerLevel[lg], maxUnlocked - 1));
        return Math.round((completedLocal / stagesPerLevel[lg]) * 100);
      }

      // Overall completion across all levels (from database)
      if (userId && DatabaseService?.getStudentProgress) {
        try {
          const rows = await DatabaseService.getStudentProgress(userId);
          let totalCompleted = 0;
          const totalStages = 6; // 3 levels × 2 stages each

          rows.forEach(row => {
            const lg = Number(row.level_group);
            if (lg >= 1 && lg <= 3) {
              const completed = Math.min(stagesPerLevel[lg], Number(row.completed_stages || 0));
              totalCompleted += completed;
            }
          });

          return Math.round((totalCompleted / totalStages) * 100);
        } catch (e) {
          console.warn('[LevelProgress] getCompletionPercentage DB error:', e);
        }
      }

      // Local fallback for overall completion
      let completedStages = 0;
      const totalStages = 6;

      for (let levelGroup = 1; levelGroup <= 3; levelGroup++) {
        const completedLevels = await LevelProgress.getCompletedLevels(levelGroup);
        if (completedLevels.includes(2)) completedStages += 1;
        if (completedLevels.includes(3)) completedStages += 1;
      }

      return Math.round((completedStages / totalStages) * 100);
    } catch (e) {
      console.error('[LevelProgress] getCompletionPercentage error:', e);
      return 0;
    }
  },

  // Update unlocks in database and sync local cache
  completeLevel: async (levelGroup = 1, stage = 1, isCorrect = false, timeRemaining = 0) => {
    try {
      const lg = Number(levelGroup) || 1;
      const st = clampStage(stage);
      const userId = await LevelProgress.getCurrentUserId();

      // Update database first (source of truth)
      if (userId && DatabaseService?.updateStudentProgress) {
        try {
          await DatabaseService.updateStudentProgress(userId, lg, st, isCorrect, timeRemaining);
          console.log('[LevelProgress] Database updated successfully');
        } catch (e) {
          console.warn('[LevelProgress] Database update failed:', e);
        }
      }

      // Update local cache for offline/immediate UI
      const raw = await AsyncStorage.getItem(LEVEL_PROGRESS_KEY);
      const all = raw ? JSON.parse(raw) : { level1: [1], level2: [], level3: [] };
      const key = `level${lg}`;
      const current = Array.isArray(all[key]) ? all[key] : [];
      const updated = new Set(current);
      const maxStage = stagesPerLevel[lg];
      
      updated.add(1);
      updated.add(st);
      
      // If correct and not final stage, unlock next stage
      if (isCorrect && st < maxStage) {
        updated.add(st + 1);
      }
      
      // If final stage completed, add completion marker
      if (isCorrect && st === maxStage) {
        updated.add(maxStage + 1);
      }
      
      // Unlock next level's stage 1 if current level completed
      if (st === maxStage && lg < 3 && isCorrect) {
        const nextKey = `level${lg + 1}`;
        const nextArr = Array.isArray(all[nextKey]) ? all[nextKey] : [];
        const nextSet = new Set(nextArr);
        nextSet.add(1);
        all[nextKey] = uniqSorted(Array.from(nextSet).map(clampStage));
      }
      
      const localNext = { ...all, [key]: uniqSorted(Array.from(updated)) };
      await AsyncStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(localNext));

      // Return refreshed data from database
      return await LevelProgress.getCompletedLevels(lg);
    } catch (e) {
      console.error('[LevelProgress] completeLevel failed:', e);
      return null;
    }
  },

  /**
   * Record a quiz answer (correct or wrong)
   */
  async recordAnswer(levelGroup, stage, isCorrect) {
    try {
      const key = `@answer_stats_${levelGroup}_${stage}`;
      const existing = await AsyncStorage.getItem(key);
      const stats = existing ? JSON.parse(existing) : { correct: 0, wrong: 0 };
      
      if (isCorrect) {
        stats.correct += 1;
      } else {
        stats.wrong += 1;
      }
      
      await AsyncStorage.setItem(key, JSON.stringify(stats));
      console.log(`[LevelProgress] Recorded ${isCorrect ? 'correct' : 'wrong'} answer for Level ${levelGroup} Stage ${stage}`);
    } catch (error) {
      console.error('[LevelProgress] Failed to record answer:', error);
    }
  },

  /**
   * Get answer statistics for a specific level and stage
   */
  async getAnswerStats(levelGroup, stage) {
    try {
      const key = `@answer_stats_${levelGroup}_${stage}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : { correct: 0, wrong: 0 };
    } catch (error) {
      console.error('[LevelProgress] Failed to get answer stats:', error);
      return { correct: 0, wrong: 0 };
    }
  },

  /**
   * Get overall user statistics with accurate calculations (from database)
   */
  async getUserStats() {
    try {
      const userId = await this.getCurrentUserId();

      // Fetch from database first
      if (userId && DatabaseService?.getStudentProgress) {
        try {
          const rows = await DatabaseService.getStudentProgress(userId);
          
          let totalCorrect = 0;
          let totalAttempts = 0;

          rows.forEach(row => {
            totalCorrect += Number(row.correct_answers || 0);
            totalAttempts += Number(row.total_attempts || 0);
          });

          const accuracy = totalAttempts > 0 
            ? Math.round((totalCorrect / totalAttempts) * 100) 
            : 0;

          return {
            overall: {
              accuracy,
              totalAttempts,
              correctAnswers: totalCorrect,
              wrongAnswers: totalAttempts - totalCorrect,
            },
          };
        } catch (e) {
          console.warn('[LevelProgress] getUserStats DB error, falling back to local:', e);
        }
      }

      // Local fallback
      let totalCorrect = 0;
      let totalWrong = 0;

      for (let levelGroup = 1; levelGroup <= 3; levelGroup++) {
        for (let stage = 1; stage <= 2; stage++) {
          const stats = await this.getAnswerStats(levelGroup, stage);
          totalCorrect += stats.correct;
          totalWrong += stats.wrong;
        }
      }

      const totalAttempts = totalCorrect + totalWrong;
      const accuracy = totalAttempts > 0 
        ? Math.round((totalCorrect / totalAttempts) * 100) 
        : 0;

      return {
        overall: {
          accuracy,
          totalAttempts,
          correctAnswers: totalCorrect,
          wrongAnswers: totalWrong,
        },
      };
    } catch (error) {
      console.error('[LevelProgress] Failed to get user stats:', error);
      return {
        overall: {
          accuracy: 0,
          totalAttempts: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
        },
      };
    }
  },

  /**
   * Reset all progress including answer statistics
   */
  async resetProgress() {
    try {
      console.log('[LevelProgress] Starting full reset...');
      const userId = await this.getCurrentUserId();
      
      // Reset in database
      if (userId && DatabaseService?.clearStudentProgress) {
        try {
          await DatabaseService.clearStudentProgress(userId);
          console.log('[LevelProgress] Database reset successful');
        } catch (e) {
          console.warn('[LevelProgress] Database reset failed:', e);
        }
      }
      
      // Reset local cache
      await AsyncStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(BASELINE_PROGRESS));
      
      // Reset answer statistics
      for (let levelGroup = 1; levelGroup <= 3; levelGroup++) {
        for (let stage = 1; stage <= 2; stage++) {
          const key = `@answer_stats_${levelGroup}_${stage}`;
          await AsyncStorage.removeItem(key);
        }
      }
      
      console.log('[LevelProgress] Full reset complete');
    } catch (error) {
      console.error('[LevelProgress] Reset failed:', error);
      throw error;
    }
  },

  // Safe no-op: prevent crashes when LevelSelect calls this for reporting
  syncProgressToBackend: async () => true,
};