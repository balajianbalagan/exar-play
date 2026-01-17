export default class ScoreManager {
    constructor() {
        if (ScoreManager.instance) return ScoreManager.instance;
        ScoreManager.instance = this;

        this.userName = localStorage.getItem('exarplay_username') || 'Player 1';
        this.sessionScores = []; // Array of { name, score, date }

        // Load session history (optional, or just keep it for this session)
        // For now, let's keep it in memory for the "session"
    }

    setUserName(name) {
        this.userName = name;
        localStorage.setItem('exarplay_username', name);
    }

    addScore(score) {
        const entry = {
            name: this.userName,
            score: score,
            timestamp: Date.now()
        };

        this.sessionScores.push(entry);
        this.sessionScores.sort((a, b) => b.score - a.score);

        // Update global high score if needed
        window.GameState.saveHighScore(score);

        return entry;
    }

    getLeaderboard() {
        return this.sessionScores.slice(0, 5); // Top 5
    }
}

export const scoreManager = new ScoreManager();
