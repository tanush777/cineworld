// ====== WATCHLIST MANAGEMENT SYSTEM ======
// Manages watchlists with categories, priority levels, and watched status

class WatchlistManager {
    constructor() {
        this.watchlists = this.loadFromStorage() || this.initializeDefaultWatchlists();
        this.observers = [];
        this.init();
    }

    initializeDefaultWatchlists() {
        return {
            'Must Watch': { movies: [], color: '#ff6b6b', description: 'Top priority' },
            'Recommendations': { movies: [], color: '#4ecdc4', description: 'Recommended by friends' },
            'Classics': { movies: [], color: '#ffd93d', description: 'Timeless films' },
            'Horror': { movies: [], color: '#6c5ce7', description: 'Scary movies' },
            'Comedy': { movies: [], color: '#a29bfe', description: 'Funny movies' },
            'Sci-Fi': { movies: [], color: '#00b894', description: 'Science fiction' }
        };
    }

    init() {
        this.renderWatchlistUI();
        this.setupEventListeners();
    }

    addToWatchlist(movieId, movieTitle, moviePoster, categoryName = 'Must Watch', watched = false) {
        if (!this.watchlists[categoryName]) {
            this.watchlists[categoryName] = { movies: [], color: '#00bfff', description: 'Custom list' };
        }

        const existingMovie = this.watchlists[categoryName].movies.find(m => m.id === movieId);
        if (!existingMovie) {
            this.watchlists[categoryName].movies.push({
                id: movieId,
                title: movieTitle,
                poster: moviePoster,
                watched: watched,
                addedDate: new Date().toISOString(),
                rating: 0,
                notes: ''
            });
            this.saveToStorage();
            this.notifyObservers('added', movieId);
        }
    }

    removeFromWatchlist(movieId, categoryName) {
        if (this.watchlists[categoryName]) {
            this.watchlists[categoryName].movies = this.watchlists[categoryName].movies.filter(m => m.id !== movieId);
            this.saveToStorage();
            this.notifyObservers('removed', movieId);
        }
    }

    markAsWatched(movieId, categoryName, watched = true) {
        if (this.watchlists[categoryName]) {
            const movie = this.watchlists[categoryName].movies.find(m => m.id === movieId);
            if (movie) {
                movie.watched = watched;
                this.saveToStorage();
                this.notifyObservers('watched', movieId);
            }
        }
    }

    addNotes(movieId, categoryName, notes) {
        if (this.watchlists[categoryName]) {
            const movie = this.watchlists[categoryName].movies.find(m => m.id === movieId);
            if (movie) {
                movie.notes = notes;
                this.saveToStorage();
            }
        }
    }

    createCustomCategory(categoryName, color, description) {
        if (!this.watchlists[categoryName]) {
            this.watchlists[categoryName] = { movies: [], color: color, description: description };
            this.saveToStorage();
            this.renderWatchlistUI();
            return true;
        }
        return false;
    }

    deleteCategory(categoryName) {
        delete this.watchlists[categoryName];
        this.saveToStorage();
        this.renderWatchlistUI();
    }

    renderWatchlistUI() {
        const html = `
            <div id="watchlist-panel" style="position: fixed; right: -400px; top: 100px; width: 380px; height: 80vh; background: linear-gradient(135deg, rgba(30, 30, 30, 0.98) 0%, rgba(28, 28, 28, 0.98) 100%); border: 1px solid rgba(0, 191, 255, 0.3); border-radius: 15px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5); z-index: 900; transition: right 0.3s ease; display: flex; flex-direction: column;">
                <div style="padding: 20px; border-bottom: 1px solid rgba(0, 191, 255, 0.2); display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="color: var(--accent-blue); margin: 0; font-size: 1.3em;">📋 My Watchlists</h3>
                    <button id="close-watchlist" style="background: none; border: none; color: var(--accent-blue); font-size: 1.5em; cursor: pointer;">&times;</button>
                </div>
                <div id="watchlist-tabs" style="display: flex; overflow-x: auto; padding: 10px; border-bottom: 1px solid rgba(0, 191, 255, 0.2); gap: 8px;">
                    ${Object.keys(this.watchlists).map(cat => `
                        <button class="watchlist-tab" data-category="${cat}" style="padding: 6px 12px; background: rgba(0, 191, 255, 0.1); border: 1px solid ${this.watchlists[cat].color}; color: ${this.watchlists[cat].color}; border-radius: 15px; cursor: pointer; font-size: 0.85em; white-space: nowrap;">
                            ${cat} (${this.watchlists[cat].movies.length})
                        </button>
                    `).join('')}
                </div>
                <div id="watchlist-content" style="flex: 1; overflow-y: auto; padding: 15px;"></div>
            </div>
        `;

        if (!document.getElementById('watchlist-panel')) {
            document.body.insertAdjacentHTML('beforeend', html);
            this.setupWatchlistListeners();
        }
    }

    setupWatchlistListeners() {
        document.body.addEventListener('click', (e) => {
            if (e.target.id === 'watchlist-toggle-btn') {
                const panel = document.getElementById('watchlist-panel');
                panel.style.right = panel.style.right === '20px' ? '-400px' : '20px';
            }
            if (e.target.id === 'close-watchlist') {
                document.getElementById('watchlist-panel').style.right = '-400px';
            }
            if (e.target && e.target.classList && e.target.classList.contains('watchlist-tab')) {
                document.querySelectorAll('.watchlist-tab').forEach(t => t.style.background = 'rgba(0, 191, 255, 0.1)');
                e.target.style.background = 'rgba(0, 191, 255, 0.2)';
                this.displayWatchlistCategory(e.target.getAttribute('data-category'));
            }
        });
    }

    displayWatchlistCategory(categoryName) {
        const category = this.watchlists[categoryName];
        const content = document.getElementById('watchlist-content');
        
        if (category.movies.length === 0) {
            content.innerHTML = `<div style="text-align: center; padding: 40px 20px; color: #999;">No movies added yet</div>`;
            return;
        }

        content.innerHTML = category.movies.map(movie => `
            <div style="background: rgba(42, 42, 42, 0.6); padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid ${category.color};">
                <div style="display: flex; gap: 10px;">
                    ${movie.poster ? `<img src="https://image.tmdb.org/t/p/w92${movie.poster}" style="width: 40px; height: 60px; border-radius: 4px; object-fit: cover;">` : ''}
                    <div style="flex: 1; font-size: 0.9em;">
                        <strong style="color: var(--accent-yellow);">${movie.title}</strong>
                        <div style="color: #999; font-size: 0.8em; margin-top: 4px;">
                            ${movie.watched ? '✓ Watched' : '⏳ Unwatched'}
                            ${movie.rating > 0 ? ` • ⭐ ${movie.rating}/10` : ''}
                        </div>
                        ${movie.notes ? `<div style="color: var(--accent-blue); font-size: 0.8em; margin-top: 4px; font-style: italic;">"${movie.notes}"</div>` : ''}
                    </div>
                    <button class="remove-from-watchlist" data-id="${movie.id}" data-category="${categoryName}" style="background: rgba(255, 0, 0, 0.2); border: none; color: #ff6b6b; cursor: pointer; padding: 4px 8px; border-radius: 4px;">×</button>
                </div>
            </div>
        `).join('');
    }

    saveToStorage() {
        localStorage.setItem('cineworld-watchlists', JSON.stringify(this.watchlists));
    }

    loadFromStorage() {
        const data = localStorage.getItem('cineworld-watchlists');
        return data ? JSON.parse(data) : null;
    }

    subscribe(observer) {
        this.observers.push(observer);
    }

    notifyObservers(action, movieId) {
        this.observers.forEach(obs => obs(action, movieId));
    }

    exportWatchlist(categoryName, format = 'json') {
        const category = this.watchlists[categoryName];
        if (format === 'json') {
            return JSON.stringify(category, null, 2);
        } else if (format === 'csv') {
            let csv = 'Title,Watched,Rating,Notes,Added Date\n';
            category.movies.forEach(m => {
                csv += `"${m.title}",${m.watched ? 'Yes' : 'No'},${m.rating},"${m.notes}",${m.addedDate}\n`;
            });
            return csv;
        }
    }

    getTotalStats() {
        let totalMovies = 0;
        let totalWatched = 0;
        Object.values(this.watchlists).forEach(cat => {
            totalMovies += cat.movies.length;
            totalWatched += cat.movies.filter(m => m.watched).length;
        });
        return { totalMovies, totalWatched };
    }
}

// Initialize watchlist manager
const watchlistManager = new WatchlistManager();
window.watchlistManager = watchlistManager;
