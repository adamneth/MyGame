// Strict alternation, 10 rounds, 1 round = both tanks fire once.
const TurnManager = {
  ROUNDS: 10,
  round: 1,
  current: 0,          // index into tanks[]; 0 = player, 1 = AI
  shotsThisRound: 0,
  phase: 'aim',        // 'aim' | 'charging' | 'flight' | 'resolve' | 'gameover'

  reset() {
    this.round = 1;
    this.current = 0;
    this.shotsThisRound = 0;
    this.phase = 'aim';
  },

  // Call after a shot fully resolves. Advances turn/round; sets 'gameover'
  // after round 10 completes.
  endShot() {
    this.shotsThisRound++;
    if (this.shotsThisRound >= 2) {
      this.shotsThisRound = 0;
      this.round++;
      if (this.round > this.ROUNDS) {
        this.phase = 'gameover';
        return;
      }
    }
    this.current = 1 - this.current;
    this.phase = 'aim';
  },
};
