// Shared game state across all scenes
export const state = {
  filename: null,
  gameId: null,
  manualTitle: '',
  noobIntro: '',
  missions: [],
  currentIndex: 0,
  score: 0,
  correctCount: 0,
  startTime: null,

  reset() {
    this.filename = null;
    this.gameId = null;
    this.manualTitle = '';
    this.noobIntro = '';
    this.missions = [];
    this.currentIndex = 0;
    this.score = 0;
    this.correctCount = 0;
    this.startTime = null;
  },

  get currentMission() {
    return this.missions[this.currentIndex] ?? null;
  },

  get isComplete() {
    return this.currentIndex >= this.missions.length;
  },

  get progress() {
    return `${this.currentIndex + 1} / ${this.missions.length}`;
  },
};
