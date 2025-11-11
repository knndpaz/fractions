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
        ? uniqSorted((localArr.includes(1) ? localArr : [1, ...localArr]).map(clampStage))
        : uniqSorted(localArr.map(clampStage)); // do NOT force stage 1 for level 2/3

    // Fresh reset short-circuit:
    // - Level 1: [1] only
    if (lg === 1 && ensuredLocal.length === 1 && ensuredLocal[0] === 1) {
      if (JSON.stringify(localArr) !== JSON.stringify([1])) {
        const next = { ...all, [`level${lg}`]: [1] };
        await AsyncStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(next));
      }
      return [1];
    }
    // - Level 2/3: empty means locked
    if (lg !== 1 && ensuredLocal.length === 0) {
      if (JSON.stringify(localArr) !== JSON.stringify([])) {
        const next = { ...all, [`level${lg}`]: [] };
        await AsyncStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(next));
      }
      return [];
    }

    // Merge DB-driven info (current_stage/completed_stages) when not a fresh reset state
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
          const maxUnlock = Math.min(currentStage, stagesPerLevel[lg]);
          for (let s = 1; s <= maxUnlock; s++) unlocked.add(s);
          for (let s = 1; s <= completedStages; s++) unlocked.add(s);
        }
      }
    } catch (e) {
      console.warn('getCompletedLevels DB merge skipped:', e?.message || e);
    }

    // Ensure progression: for levels > 1, don't unlock any stages if previous level is not completed
    if (lg > 1) {
      const prevCompleted = (await LevelProgress.getCompletedLevels(lg - 1)).includes(stagesPerLevel[lg - 1]);
      if (!prevCompleted) {
        unlocked.clear();
      }
    }

    const result = uniqSorted(Array.from(unlocked).map(clampStage));

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

      // Local first for responsive UI
      const raw = await AsyncStorage.getItem(LEVEL_PROGRESS_KEY);
      const all = raw ? JSON.parse(raw) : { level1: [1], level2: [], level3: [] };
      const key = `level${lg}`;
      const current = Array.isArray(all[key]) ? all[key] : [];
      const updated = new Set(current);
      updated.add(1);
      updated.add(st);
      if (isCorrect && st < stagesPerLevel[lg]) {
        updated.add(st + 1);
      }
      // Unlock next level group stage 1 if final stage of current level completed
      if (st === stagesPerLevel[lg] && lg < 3) {
        const nextKey = `level${lg + 1}`;
        const nextArr = Array.isArray(all[nextKey]) ? all[nextKey] : [];
        const nextSet = new Set(nextArr);
        nextSet.add(1);
        all[nextKey] = uniqSorted(Array.from(nextSet).map(clampStage));
      }
      const localNext = { ...all, [key]: uniqSorted(Array.from(updated).map(clampStage)) };
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

  // Aggregate stats for LevelSelect (DB-first, fallback local)
  getUserStats: async () => {
    try {
      const baseLevels = {
        1: { completedStages: 0, currentStage: 1, completionRate: 0, totalAttempts: 0, correctAnswers: 0, accuracy: 0, unlockedStages: [1] },
        2: { completedStages: 0, currentStage: 1, completionRate: 0, totalAttempts: 0, correctAnswers: 0, accuracy: 0, unlockedStages: [] },
        3: { completedStages: 0, currentStage: 1, completionRate: 0, totalAttempts: 0, correctAnswers: 0, accuracy: 0, unlockedStages: [] },
      };

      // Seed unlocked from local storage
      try {
        const local = await LevelProgress.getAllProgress();
        if (local?.level1) baseLevels[1].unlockedStages = uniqSorted(local.level1.map(clampStage));
        if (local?.level2) baseLevels[2].unlockedStages = uniqSorted(local.level2.map(clampStage));
        if (local?.level3) baseLevels[3].unlockedStages = uniqSorted(local.level3.map(clampStage));
      } catch {}

      const userId = await LevelProgress.getCurrentUserId();
      let rows = [];
      if (userId && DatabaseService?.getStudentProgress) {
        try {
          rows = await DatabaseService.getStudentProgress(userId);
        } catch {
          rows = [];
        }
      }

      const levels = { ...baseLevels };

      for (const r of rows) {
        const g = Number(r.level_group);
        if (![1, 2, 3].includes(g)) continue;

        levels[g].completedStages = Number(r.completed_stages ?? 0);
        levels[g].currentStage = Number(r.current_stage ?? 1);
        levels[g].totalAttempts = Number(r.total_attempts ?? 0);
        levels[g].correctAnswers = Number(r.correct_answers ?? 0);
        levels[g].accuracy = Number(r.accuracy ?? toPct(levels[g].correctAnswers, levels[g].totalAttempts));
        levels[g].completionRate = Number(r.completion_rate ?? toPct(levels[g].completedStages, stagesPerLevel[g]));

        // Keep unlockedStages consistent with completed/current
        const unlocked = new Set(levels[g].unlockedStages || []);
        unlocked.add(1);
        const maxUnlock = Math.min(Math.max(levels[g].currentStage + 1, 1), stagesPerLevel[g]);
        for (let s = 1; s <= maxUnlock; s++) unlocked.add(s);
        for (let s = 1; s <= levels[g].completedStages; s++) unlocked.add(s);

        // Ensure progression: for levels > 1, don't unlock stages beyond 1 if previous level is not completed
        if (g > 1) {
          const prevCompleted = levels[g - 1].completedStages >= stagesPerLevel[g - 1];
          if (!prevCompleted) {
            unlocked.forEach(s => {
              if (s > 1) unlocked.delete(s);
            });
          }
        }

        levels[g].unlockedStages = uniqSorted(Array.from(unlocked).map(clampStage));
      }

      const overallAttempts = [1, 2, 3].reduce((sum, k) => sum + (levels[k].totalAttempts || 0), 0);
      const overallCorrect = [1, 2, 3].reduce((sum, k) => sum + (levels[k].correctAnswers || 0), 0);
      const overall = {
        totalAttempts: overallAttempts,
        correctAnswers: overallCorrect,
        accuracy: toPct(overallCorrect, overallAttempts),
      };

      return { overall, levels };
    } catch {
      return {
        overall: { totalAttempts: 0, correctAnswers: 0, accuracy: 0 },
        levels: {
          1: { completedStages: 0, currentStage: 1, completionRate: 0, totalAttempts: 0, correctAnswers: 0, accuracy: 0, unlockedStages: [1] },
          2: { completedStages: 0, currentStage: 1, completionRate: 0, totalAttempts: 0, correctAnswers: 0, accuracy: 0, unlockedStages: [] },
          3: { completedStages: 0, currentStage: 1, completionRate: 0, totalAttempts: 0, correctAnswers: 0, accuracy: 0, unlockedStages: [] },
        },
      };
    }
  },

  // Safe no-op: prevent crashes when LevelSelect calls this for reporting
  syncProgressToBackend: async () => true,
};