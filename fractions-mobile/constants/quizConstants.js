/**
 * Quiz component constants and configuration values
 */

// Timer and quiz configuration
export const QUIZ_CONFIG = {
  INITIAL_TIMER: 60,
  INITIAL_QUIZ_INDEX: 1,
  TOTAL_QUESTIONS: 5,
  TOTAL_PROGRESS_DOTS: 5,
  TOTAL_LEVELS: 3,
  TOTAL_STAGES: 2,
};

// Animation durations (in milliseconds)
export const ANIMATION_DURATIONS = {
  TIMER_PULSE: 200,
  CARD_IN: 400,
  SPARKLE_LOOP: 2000,
  BUTTON_PRESS: 100,
  TIMER_INTERVAL: 1000,
};

// Animation values
export const ANIMATION_VALUES = {
  CARD_SCALE_INITIAL: 0.9,
  CARD_SCALE_FINAL: 1,
  CARD_OPACITY_INITIAL: 0,
  CARD_OPACITY_FINAL: 1,
  BUTTON_SCALE_PRESSED: 0.9,
  BUTTON_SCALE_NORMAL: 1,
  TIMER_PULSE_SCALE: 1.2,
  SPARKLE_OPACITY_MIN: 0.3,
  SPARKLE_OPACITY_MAX: 1,
};

// Responsive scaling factors
export const SCALING_CONFIG = {
  BASE_WIDTH: 375,
  BASE_HEIGHT: 812,
  MODERATE_SCALE_FACTOR: 0.5,
};

// Timer color thresholds (in seconds)
export const TIMER_THRESHOLDS = {
  LOW: 10,
  MEDIUM: 30,
};

// Colors for timer
export const TIMER_COLORS = {
  LOW: "#FF6B6B",
  MEDIUM: "#FFA85C",
  HIGH: "#4CAF50",
};

// Button scales array length (4 answer buttons)
export const BUTTON_SCALES_COUNT = 4;

// Sparkle positions (relative scaling)
export const SPARKLE_POSITIONS = {
  TOP_LEFT: { top: 100, left: 40 },
  TOP_RIGHT: { top: 200, right: 30 },
};

// Modal and UI dimensions
export const UI_DIMENSIONS = {
  MODAL_WIDTH: 300,
  MODAL_HEIGHT: 400,
  HELP_MODAL_WIDTH: 300,
  HELP_MODAL_HEIGHT: 400,
  TIMER_CONTAINER_HEIGHT: 44,
  PROGRESS_CONTAINER_HEIGHT: 44,
  LEVEL_INDICATOR_HEIGHT: 44,
  QUIZ_CARD_WIDTH: 320,
  QUIZ_CARD_HEIGHT: 200,
  ANSWER_BUTTON_WIDTH: 150,
  ANSWER_BUTTON_HEIGHT: 52,
  FEEDBACK_CARD_HEIGHT: 120,
};

// Font sizes
export const FONT_SIZES = {
  TIMER: 28,
  TIMER_LABEL: 12,
  LEVEL_TEXT: 12,
  QUESTION_LABEL: 14,
  ANSWER_TEXT: 18,
  FEEDBACK_TITLE: 20,
  FEEDBACK_SUBTEXT: 12,
  ACTION_BUTTON_TEXT: 16,
  NAV_BUTTON_TEXT: 14,
  HELP_TITLE: 18,
  HELP_STEP_TEXT: 13,
  CLOSE_BUTTON: 16,
  HELP_BUTTON: 16,
  BACK_BUTTON: 22,
};

// Border radii
export const BORDER_RADII = {
  TIMER_CONTAINER: 25,
  PROGRESS_CONTAINER: 16,
  LEVEL_INDICATOR: 14,
  QUIZ_CARD: 20,
  ANSWER_BUTTON: 14,
  FEEDBACK_CARD: 20,
  MODAL: 20,
  HELP_MODAL: 20,
  NAV_BUTTON: 14,
  CLOSE_BUTTON: 14,
  HELP_BUTTON: 14,
  BACK_BUTTON: 22,
};

// Elevation/shadow values
export const ELEVATIONS = {
  TIMER_CONTAINER: 10,
  PROGRESS_CONTAINER: 6,
  LEVEL_INDICATOR: 6,
  QUIZ_CARD: 12,
  ANSWER_BUTTON: 6,
  FEEDBACK_CARD: 16,
  MODAL: 20,
  HELP_MODAL: 20,
  NAV_BUTTON: 4,
  HELP_BUTTON: 4,
};

// Opacity values
export const OPACITIES = {
  MODAL_OVERLAY: 0.7,
  GRADIENT_OVERLAY: 0.2,
  PROGRESS_BACKGROUND: 0.95,
  SHADOW: 0.25,
  BORDER: 0.3,
};

// Z-index values
export const Z_INDICES = {
  BACK_BUTTON: 10,
  TIMER_CONTAINER: 10,
  PROGRESS_CONTAINER: 10,
  LEVEL_INDICATOR: 10,
  QUIZ_CARD: 10,
  FEEDBACK_CONTAINER: 100,
  SPARKLE: 1,
};

// Platform-specific positioning
export const PLATFORM_OFFSETS = {
  IOS_TOP_OFFSET: 50,
  ANDROID_TOP_OFFSET: 40,
  IOS_QUIZ_TOP: 195,
  ANDROID_QUIZ_TOP: 185,
  IOS_PROGRESS_TOP: 105,
  ANDROID_PROGRESS_TOP: 95,
  IOS_LEVEL_TOP: 145,
  ANDROID_LEVEL_TOP: 135,
};

// Answer button layout
export const ANSWER_LAYOUT = {
  ROWS: 2,
  COLUMNS: 2,
  GAP: 10,
  CONTAINER_BOTTOM: 120,
};

// Help modal configuration
export const HELP_CONFIG = {
  INITIAL_STEP: 0,
  STEPS_PER_QUIZ: 5,
};

// Sound file paths (relative to assets/audio)
export const SOUND_PATHS = {
  CORRECT: "Check mark sound effect.mp3",
  WRONG: "Wrong Answer Sound effect.mp3",
  BATTLE_MUSIC: "We Must Battle NOW! - Cody O'Quinn - 01 We Must Battle NOW!.mp3",
  BACKGROUND_MUSIC: "18 - Seeker's Path.wav",
};

// Image paths (relative to assets)
export const IMAGE_PATHS = {
  BACKGROUND: "map 1.png",
  TIMER_ICON: "clock.png",
  FRACTION_SAMPLE_1: "fractionsample 1.png",
  FRACTION_SAMPLE_2: "fractionsample 2.png",
};

// Asset folders
export const ASSET_FOLDERS = {
  EASY_STAGE_1: "Easy Stage 1",
  EASY_STAGE_2: "Easy Stage 2",
  MEDIUM_STAGE_1: "Medium Stage 1",
  MEDIUM_STAGE_2: "Medium Stage 2",
};
