import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseService, supabase } from '../supabase';

const LEVEL_PROGRESS_KEY = 'levelProgress';
const USER_ID_KEY = 'userId';

// Configure how many stages exist per level group
const MAX_STAGE = 4;

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

  // Read all local progress (unlocked stages arrays)
  getAllProgress: async () => {
    const raw = await AsyncStorage.getItem(LEVEL_PROGRESS_KEY);
    if (!raw) return { level1: [1], level2: [], level3: [] };
    try {
      const parsed = JSON.parse(raw);
      return {
        level1: Array.isArray(parsed.level1) ? parsed.level1 : [1],
        level2: Array.isArray(parsed.level2) ? parsed.level2 : [],
        level3: Array.isArray(parsed.level3) ? parsed.level3 : [],
      };
    } catch {
      return { level1: [1], level2: [], level3: [] };
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
      const userId = await LevelProgress.getCurrentUserId();

      // Normalize levelGroup to a valid number 1..3 (or NaN if invalid)
      const lg = Number(levelGroup);
      const isValidGroup = Number.isInteger(lg) && lg >= 1 && lg <= 3;

      // Update local storage
      const current = await LevelProgress.getAllProgress();
      let next = { ...current };

      if (isValidGroup) {
        next[`level${lg}`] = [1]; // only stage 1 unlocked in that group
      } else {
        next = { level1: [1], level2: [], level3: [] }; // reset all
      }
      await LevelProgress.setAllProgress(next);

      // Update DB (best-effort)
      if (userId && DatabaseService?.clearStudentProgress) {
        await DatabaseService.clearStudentProgress(userId, isValidGroup ? lg : undefined);
      }

      return next;
    } catch (e) {
      console.warn('resetProgress failed:', e);
      // Still return a sane local state
      return { level1: [1], level2: [], level3: [] };
    }
  },

  // Existing API used by MapLevels (returns unlocked stages list)
  getCompletedLevels: async (levelGroup = 1) => {
    const lg = Number(levelGroup) || 1;

    // 1) Start from local unlocked stages
    const all = await LevelProgress.getAllProgress();
    const localArr = Array.isArray(all[`level${lg}`]) ? all[`level${lg}`] : [];
    const unlocked = new Set(localArr.map(clampStage));
    unlocked.add(1); // always ensure stage 1 is unlocked

    // 2) Merge DB-driven unlocks using current_stage and completed_stages (if available)
    try {
      const userId = await LevelProgress.getCurrentUserId();
      if (userId && DatabaseService?.getStudentProgress) {
        const rows = await DatabaseService.getStudentProgress(userId);
        const row = Array.isArray(rows)
          ? rows.find(r => Number(r.level_group) === lg)
          : null;

        if (row) {
          const currentStage = Math.max(1, Math.min(MAX_STAGE, Number(row.current_stage || 1)));
          const completedStages = Math.max(0, Math.min(MAX_STAGE, Number(row.completed_stages || 0)));

          // Unlock up to current_stage + 1 (bounded to MAX_STAGE)
          const maxUnlock = Math.min(currentStage + 1, MAX_STAGE);
          for (let s = 1; s <= maxUnlock; s++) unlocked.add(s);

          // Ensure all completed stages are unlocked
          for (let s = 1; s <= completedStages; s++) unlocked.add(s);
        }
      }
    } catch (e) {
      console.warn('getCompletedLevels DB merge skipped:', e?.message || e);
    }

    // 3) Finalize list and persist if changed
    const merged = Array.from(unlocked).map(clampStage);
    const result = Array.from(new Set(merged)).sort((a, b) => a - b);

    // Persist back if different from local
    const localSorted = Array.from(new Set(localArr.map(clampStage))).sort((a, b) => a - b);
    const changed =
      result.length !== localSorted.length ||
      result.some((v, i) => v !== localSorted[i]);

    if (changed) {
      const next = { ...all, [`level${lg}`]: result };
      await LevelProgress.setAllProgress(next);
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
            return Math.round((Math.min(MAX_STAGE, Math.max(0, completed)) / MAX_STAGE) * 100);
          }
        } catch {
          // fall through to local
        }
      }

      // Local fallback
      const all = await LevelProgress.getAllProgress();
      const arr = all[`level${levelGroup}`] || [];
      const maxUnlocked = arr.length ? Math.max(...arr) : 1; // unlocked may include next stage
      const completedLocal = Math.max(0, Math.min(MAX_STAGE, maxUnlocked - 1));
      return Math.round((completedLocal / MAX_STAGE) * 100);
    } catch {
      return 0;
    }
  },

  // Update unlocks locally and sync DB after a stage result
  completeLevel: async (levelGroup = 1, stage = 1, isCorrect = false, timeRemaining = 0) => {
    try {
      const lg = Number(levelGroup) || 1;
      const st = clampStage(stage);

      // Update local unlocks first for responsive UI
      const all = await LevelProgress.getAllProgress();
      const key = `level${lg}`;
      const current = Array.isArray(all[key]) ? all[key] : [];
      const updated = new Set(current);
      updated.add(1);        // ensure stage 1 always unlocked
      updated.add(st);       // mark current stage as seen/unlocked

      // Unlock the next stage when a stage is finished and correct
      if (isCorrect && st < MAX_STAGE) {
        updated.add(st + 1);
      }

      // If final stage completed correctly, unlock next level group stage 1
      if (isCorrect && st === MAX_STAGE && lg < 3) {
        const nextGroupKey = `level${lg + 1}`;
        const nextGroupArr = Array.isArray(all[nextGroupKey]) ? all[nextGroupKey] : [];
        const nextGroupSet = new Set(nextGroupArr);
        nextGroupSet.add(1); // unlock first stage of next level group
        all[nextGroupKey] = uniqSorted(Array.from(nextGroupSet).map(clampStage));
      }

      const localNext = { ...all, [key]: uniqSorted(Array.from(updated).map(clampStage)) };
      await LevelProgress.setAllProgress(localNext);

      // Best-effort DB update
      try {
        const userId = await LevelProgress.getCurrentUserId();
        if (userId && DatabaseService?.updateStudentProgress) {
          await DatabaseService.updateStudentProgress(userId, lg, st, isCorrect, timeRemaining);
        }
      } catch (e) {
        console.warn('DB progress update failed (ignored):', e?.message || e);
      }

      // Recompute merged unlocks (local + DB) and persist final state
      const finalList = await LevelProgress.getCompletedLevels(lg);
      return finalList;
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
        levels[g].completionRate = Number(r.completion_rate ?? toPct(levels[g].completedStages, MAX_STAGE));

        // Keep unlockedStages consistent with completed/current
        const unlocked = new Set(levels[g].unlockedStages || []);
        unlocked.add(1);
        const maxUnlock = Math.min(Math.max(levels[g].currentStage + 1, 1), MAX_STAGE);
        for (let s = 1; s <= maxUnlock; s++) unlocked.add(s);
        for (let s = 1; s <= levels[g].completedStages; s++) unlocked.add(s);
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
};