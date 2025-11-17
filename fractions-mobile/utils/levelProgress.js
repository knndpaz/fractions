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

  // Ensure we can always read a valid progress object
  getAllProgress: async () => {
    try {
      const raw = await AsyncStorage.getItem(LEVEL_PROGRESS_KEY);
      if (!raw) {
        await AsyncStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(BASELINE_PROGRESS));
        return BASELINE_PROGRESS;
      }
      const parsed = JSON.parse(raw);
      return {
        level1: Array.isArray(parsed.level1) ? parsed.level1 : [1],
        level2: Array.isArray(parsed.level2) ? parsed.level2 : [],
        level3: Array.isArray(parsed.level3) ? parsed.level3 : [],
      };
    } catch {
      await AsyncStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(BASELINE_PROGRESS));
      return BASELINE_PROGRESS;
    }
  },

  // Persist local progress
  setAllProgress: async (obj) => {
    await AsyncStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(obj));
  },

  // Reset progress (local + DB). If levelGroup provided, only reset that group.
  // Return the new local progress object so callers can update UI immediately.
  resetProgress: async (levelGroup) => {
    try {
      // Normalize and validate group
      const lg = Number(levelGroup);
      const isValidGroup = Number.isInteger(lg) && lg >= 1 && lg <= 3;

      // Local reset
      const current = await LevelProgress.getAllProgress();
      let next = { ...current };

      if (isValidGroup) {
        next[`level${lg}`] = [1];
      } else {
        next = { ...BASELINE_PROGRESS };
      }

      await AsyncStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(next));

      // Best-effort DB reset (if available)
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data?.user?.id || (await AsyncStorage.getItem(USER_ID_KEY));
        if (userId && DatabaseService?.clearStudentProgress) {
          await DatabaseService.clearStudentProgress(userId, isValidGroup ? lg : undefined);
        }
      } catch {
        // ignore server errors during reset
      }

      return next;
    } catch {
      return { ...BASELINE_PROGRESS };
    }
  },

  // Existing API used by MapLevels (returns unlocked stages list)
  getCompletedLevels: async (levelGroup = 1) => {
    const lg = Number(levelGroup) || 1;

    // Start from local state
    const raw = await AsyncStorage.getItem(LEVEL_PROGRESS_KEY);
    const all = raw ? JSON.parse(raw) : { level1: [1], level2: [], level3: [] };
    const localArr = Array.isArray(all[`level${lg}`]) ? all[`level${lg}`] : [];

    // Only Level 1 should auto-unlock stage 1
    const ensuredLocal =
      lg === 1
        ? uniqSorted((localArr.includes(1) ? localArr : [1, ...localArr]))
        : uniqSorted(localArr); // do NOT force stage 1 for level 2/3

    // Fresh reset short-circuit:
    // - Level 1: [1] only
    if (lg === 1 && ensuredLocal.length === 1 && ensuredLocal[0] === 1) {
      // Check DB first before assuming it's fresh
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data?.user?.id || (await AsyncStorage.getItem(USER_ID_KEY));
        if (userId && DatabaseService?.getStudentProgress) {
          const rows = await DatabaseService.getStudentProgress(userId);
          const row = Array.isArray(rows) ? rows.find(r => Number(r.level_group) === lg) : null;
          if (row && Number(row.completed_stages) > 0) {
            // Not fresh - has DB progress
          } else {
            return [1];
          }
        } else {
          return [1];
        }
      } catch {
        return [1];
      }
    }
    // - Level 2/3: empty means locked (unless DB says otherwise)
    if (lg !== 1 && ensuredLocal.length === 0) {
      // Check DB before assuming locked
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data?.user?.id || (await AsyncStorage.getItem(USER_ID_KEY));
        if (userId && DatabaseService?.getStudentProgress) {
          const rows = await DatabaseService.getStudentProgress(userId);
          const row = Array.isArray(rows) ? rows.find(r => Number(r.level_group) === lg) : null;
          if (!row || Number(row.current_stage) <= 1) {
            return [];
          }
          // Has DB progress, continue to merge
        } else {
          return [];
        }
      } catch {
        return [];
      }
    }

    // Merge DB-driven info (current_stage/completed_stages)
    const unlocked = new Set(ensuredLocal);
    try {
      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id || (await AsyncStorage.getItem(USER_ID_KEY));
      if (userId && DatabaseService?.getStudentProgress) {
        const rows = await DatabaseService.getStudentProgress(userId);
        const row = Array.isArray(rows) ? rows.find(r => Number(r.level_group) === lg) : null;
        if (row) {
          const currentStage = Math.max(1, Math.min(stagesPerLevel[lg], Number(row.current_stage || 1)));
          const completedStages = Math.max(0, Math.min(stagesPerLevel[lg], Number(row.completed_stages || 0)));
          
          // Add all unlocked stages up to current
          for (let s = 1; s <= currentStage; s++) {
            unlocked.add(s);
          }
          
          // Add all completed stages
          for (let s = 1; s <= completedStages; s++) {
            unlocked.add(s);
          }
          
          // If all stages are completed, add the completion marker (stage 3)
          if (completedStages >= stagesPerLevel[lg]) {
            unlocked.add(stagesPerLevel[lg] + 1); // Add completion marker
          }
        }
      }
    } catch (e) {
      console.warn('getCompletedLevels DB merge skipped:', e?.message || e);
    }

    // Ensure progression: for levels > 1, don't unlock any stages if previous level is not completed
    if (lg > 1) {
      const prevProgress = await LevelProgress.getCompletedLevels(lg - 1);
      const prevCompleted = prevProgress.includes(stagesPerLevel[lg - 1] + 1); // Check for completion marker
      if (!prevCompleted) {
        unlocked.clear();
      }
    }

    const result = uniqSorted(Array.from(unlocked));

    // Persist merged if different
    if (JSON.stringify(result) !== JSON.stringify(localArr)) {
      const next = { ...all, [`level${lg}`]: result };
      await AsyncStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(next));
    }

    return result;
  },

  isLevelUnlocked: (stage, unlockedList) => {
    return Array.isArray(unlockedList) && unlockedList.includes(stage);
  },

  // New: compute completion percentage for a level group (DB-first, fallback local)
  getCompletionPercentage: async (levelGroup = 1) => {
    try {
      const userId = await LevelProgress.getCurrentUserId();

      // DB path
      if (userId && DatabaseService?.getStudentProgress) {
        try {
          const rows = await DatabaseService.getStudentProgress(userId);
          const row = rows?.find(r => Number(r.level_group) === Number(levelGroup));
          if (row) {
            const pct = Number(row.completion_rate);
            if (!Number.isNaN(pct) && pct >= 0) return pct;
            const completed = Number(row.completed_stages ?? 0);
            return Math.round((Math.min(stagesPerLevel[levelGroup], Math.max(0, completed)) / stagesPerLevel[levelGroup]) * 100);
          }
        } catch {
          // fall through to local
        }
      }

      // Local fallback
      const all = await LevelProgress.getAllProgress();
      const arr = all[`level${levelGroup}`] || [];
      const maxUnlocked = arr.length ? Math.max(...arr) : 1; // unlocked may include next stage
      const completedLocal = Math.max(0, Math.min(stagesPerLevel[levelGroup], maxUnlocked - 1));
      return Math.round((completedLocal / stagesPerLevel[levelGroup]) * 100);
    } catch {
      return 0;
    }
  },

  // Update unlocks locally and sync DB after a stage result
  completeLevel: async (levelGroup = 1, stage = 1, isCorrect = false, timeRemaining = 0) => {
    try {
      const lg = Number(levelGroup) || 1;
      const st = clampStage(stage);
      const maxStage = stagesPerLevel[lg];

      // Local first for responsive UI
      const raw = await AsyncStorage.getItem(LEVEL_PROGRESS_KEY);
      const all = raw ? JSON.parse(raw) : { level1: [1], level2: [], level3: [] };
      const key = `level${lg}`;
      const current = Array.isArray(all[key]) ? all[key] : [];
      const updated = new Set(current);
      updated.add(1);
      updated.add(st);
      
      // If this is correct and not the final stage, unlock next stage
      if (isCorrect && st < maxStage) {
        updated.add(st + 1);
      }
      
      // If this is the final stage (stage 2), add a marker (stage 3) to indicate completion
      // This is only for tracking completion, not an actual playable stage
      if (isCorrect && st === maxStage) {
        updated.add(maxStage + 1); // Add stage 3 as a completion marker
      }
      
      // Unlock next level group stage 1 if final stage of current level completed
      if (st === maxStage && lg < 3 && isCorrect) {
        const nextKey = `level${lg + 1}`;
        const nextArr = Array.isArray(all[nextKey]) ? all[nextKey] : [];
        const nextSet = new Set(nextArr);
        nextSet.add(1);
        all[nextKey] = uniqSorted(Array.from(nextSet).map(clampStage));
      }
      
      const localNext = { ...all, [key]: uniqSorted(Array.from(updated)) };
      await AsyncStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(localNext));

      // Best-effort DB update
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data?.user?.id || (await AsyncStorage.getItem(USER_ID_KEY));
        if (userId && DatabaseService?.updateStudentProgress) {
          await DatabaseService.updateStudentProgress(userId, lg, st, isCorrect, timeRemaining);
        }
      } catch (e) {
        console.warn('DB progress update failed (ignored):', e?.message || e);
      }

      // Recompute merged unlocks and return
      return await LevelProgress.getCompletedLevels(lg);
    } catch (e) {
      console.error('completeLevel failed:', e);
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
   * Get overall user statistics with accurate calculations
   */
  async getUserStats() {
    try {
      let totalCorrect = 0;
      let totalWrong = 0;

      // Collect stats from all levels and stages
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
   * Get completion percentage based on actually completed stages
   */
  async getCompletionPercentage() {
    try {
      let completedStages = 0;
      const totalStages = 6; // 3 levels × 2 stages each

      for (let levelGroup = 1; levelGroup <= 3; levelGroup++) {
        const completedLevels = await this.getCompletedLevels(levelGroup);
        
        // Count completed stages (stage N is completed if stage N+1 is unlocked)
        if (completedLevels.includes(2)) {
          completedStages += 1; // Stage 1 completed
        }
        if (completedLevels.includes(3)) {
          completedStages += 1; // Stage 2 completed
        }
      }

      const percentage = Math.round((completedStages / totalStages) * 100);
      console.log(`[LevelProgress] Completion: ${completedStages}/${totalStages} stages = ${percentage}%`);
      
      return percentage;
    } catch (error) {
      console.error('[LevelProgress] Failed to get completion percentage:', error);
      return 0;
    }
  },

  /**
   * Reset all progress including answer statistics
   */
  async resetProgress() {
    try {
      console.log('[LevelProgress] Starting full reset...');
      
      // Reset level progress
      await AsyncStorage.setItem('@level_progress_1', JSON.stringify([1]));
      await AsyncStorage.setItem('@level_progress_2', JSON.stringify([]));
      await AsyncStorage.setItem('@level_progress_3', JSON.stringify([]));
      
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