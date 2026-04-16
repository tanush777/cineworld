// ====== FEATURE INTEGRATION SYSTEM ======
// Connects all new feature managers to the UI

let currentMovieData = {}; // Store current movie data globally
let currentContentType = 'movies'; // Track whether showing movies or TV series
let currentTVShows = []; // Store current TV shows for filtering

// TV Genre ID to Name Mapping (TMDB API)
const TV_GENRE_MAP = {
    10759: 'Action',
    10765: 'Sci-Fi',
    18: 'Drama',
    35: 'Comedy',
    80: 'Crime',
    10762: 'Kids',
    10763: 'News',
    10764: 'Reality',
    10767: 'Talk',
    10768: 'Thriller',
    37: 'Western',
    10750: 'Fantasy'
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing features...');
    initializeAllFeatures();
    setupContentToggle();
});

function setupContentToggle() {
    const moviesTab = document.getElementById('movies-tab');
    const tvSeriesTab = document.getElementById('tv-series-tab');
    const tvSeriesControls = document.getElementById('tv-series-controls');

    if (moviesTab) {
        moviesTab.addEventListener('click', () => {
            console.log('[setupContentToggle] Movies tab clicked');
            currentContentType = 'movies';
            
            // Set global search mode to movie for suggestions
            window.currentSearchMode = 'movie';
            console.log('[setupContentToggle] Set currentSearchMode to "movie"');
            
            // Set search suggestions mode to movie
            if (window.searchSuggestions) {
                window.searchSuggestions.setMode('movie');
                console.log('[setupContentToggle] Set search suggestions mode to "movie"');
            }
            
            // Clear search inputs
            const movieSearchInput = document.getElementById('search-input');
            if (movieSearchInput) movieSearchInput.value = '';
            
            const tvSearchInput = document.getElementById('tv-search-input');
            if (tvSearchInput) tvSearchInput.value = '';
            
            moviesTab.style.background = 'rgba(0, 191, 255, 0.2)';
            moviesTab.style.borderColor = 'rgba(0, 191, 255, 0.5)';
            tvSeriesTab.style.background = 'rgba(102, 205, 170, 0.1)';
            tvSeriesTab.style.borderColor = 'rgba(102, 205, 170, 0.3)';
            tvSeriesControls.style.display = 'none';
            document.getElementById('controls-section').style.display = 'block';
            
            // Remove TV sentinel if it exists
            const tvSentinel = document.getElementById('tv-scroll-sentinel');
            if (tvSentinel) tvSentinel.remove();
            
            console.log('[setupContentToggle] Movies tab setup complete');
        });
    }

    if (tvSeriesTab) {
        tvSeriesTab.addEventListener('click', () => {
            console.log('[setupContentToggle] TV Series tab clicked');
            currentContentType = 'tv';
            
            // Set global search mode to TV for suggestions
            window.currentSearchMode = 'tv';
            console.log('[setupContentToggle] Set currentSearchMode to "tv"');
            
            // Set search suggestions mode to TV
            if (window.searchSuggestions) {
                window.searchSuggestions.setMode('tv');
                console.log('[setupContentToggle] Set search suggestions mode to "tv"');
            }
            
            // Clear search inputs
            const movieSearchInput = document.getElementById('search-input');
            if (movieSearchInput) movieSearchInput.value = '';
            
            const tvSearchInput = document.getElementById('tv-search-input');
            if (tvSearchInput) tvSearchInput.value = '';
            
            tvSeriesTab.style.background = 'rgba(102, 205, 170, 0.2)';
            tvSeriesTab.style.borderColor = 'rgba(102, 205, 170, 0.5)';
            moviesTab.style.background = 'rgba(0, 191, 255, 0.1)';
            moviesTab.style.borderColor = 'rgba(0, 191, 255, 0.3)';
            tvSeriesControls.style.display = 'block';
            document.getElementById('controls-section').style.display = 'none';
            
            // Initialize hasMorePages for TV shows
            tvManager.hasMorePages = true;
            tvManager.currentPage = 0; // Will be incremented to 1 in loadTVSeries
            
            loadTVSeries('trending');
            console.log('[setupContentToggle] TV Series tab setup complete');
        });
    }

    // TV Series search
    const tvSearchInput = document.getElementById('tv-search-input');
    const tvSearchButton = document.getElementById('tv-search-button');

    if (tvSearchButton) {
        tvSearchButton.addEventListener('click', () => {
            const query = tvSearchInput.value.trim();
            if (query) {
                searchTVSeries(query);
            }
        });
    }

    if (tvSearchInput) {
        tvSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = tvSearchInput.value.trim();
                if (query) {
                    searchTVSeries(query);
                }
            }
        });
    }

    // TV Discovery tabs
    const tvDiscoveryTabs = document.querySelectorAll('.tv-discovery-tab');
    tvDiscoveryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tvDiscoveryTabs.forEach(t => {
                t.style.background = 'rgba(102, 205, 170, 0.1)';
                t.style.borderColor = 'rgba(102, 205, 170, 0.3)';
            });
            tab.style.background = 'rgba(102, 205, 170, 0.2)';
            tab.style.borderColor = 'rgba(102, 205, 170, 0.5)';
            const tabType = tab.getAttribute('data-tab');
            loadTVSeries(tabType);
        });
    });

    // Initialize TV Genre Filters
    setupTVGenreFilters();
}

function setupTVGenreFilters() {
    const genreButtons = document.querySelectorAll('.tv-genre-btn');
    genreButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedGenre = button.getAttribute('data-genre');
            
            // Update active state
            genreButtons.forEach(btn => {
                btn.style.background = 'rgba(102, 205, 170, 0.1)';
                btn.style.borderColor = 'rgba(102, 205, 170, 0.3)';
            });
            button.style.background = 'rgba(102, 205, 170, 0.2)';
            button.style.borderColor = 'rgba(102, 205, 170, 0.5)';

            // Filter TV shows - only TV items in the grid
            const movieGrid = document.querySelector('.movie-grid');
            const allCards = movieGrid.querySelectorAll('.movie');

            allCards.forEach(card => {
                // Only filter if it's a TV show
                if (card.getAttribute('data-type') === 'tv') {
                    const cardGenre = card.getAttribute('data-genre') || 'all';
                    if (selectedGenre === 'all' || cardGenre === selectedGenre) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
        });
    });
}

function getGenreNameFromIds(genreIds) {
    if (!genreIds || genreIds.length === 0) return 'all';
    // Get the first genre ID and convert to name
    const firstGenreId = genreIds[0];
    return TV_GENRE_MAP[firstGenreId] || 'all';
}

async function searchTVSeries(query) {
    const movieGrid = document.querySelector('.movie-grid');
    movieGrid.innerHTML = '<div class="spinner" style="display: block;"></div>';

    try {
        if (typeof tvManager === 'undefined') {
            throw new Error('TV Manager not loaded');
        }
        
        // Reset pagination
        tvManager.currentPage = 1;
        tvManager.searchQuery = query;
        tvManager.currentType = 'search';
        
        const data = await tvManager.searchTVShows(query, 1);
        displayTVSeries(data.results, true); // true means it's a search
    } catch (error) {
        console.error('Error searching TV series:', error);
        movieGrid.innerHTML = '<p style="text-align: center; color: red;">Failed to search TV series. Please try again.</p>';
    }
}

async function loadTVSeries(type) {
    const movieGrid = document.querySelector('.movie-grid');
    movieGrid.innerHTML = '<div class="spinner" style="display: block;"></div>';

    try {
        if (typeof tvManager === 'undefined') {
            throw new Error('TV Manager not loaded');
        }

        // Reset pagination for new load
        tvManager.currentPage = 1;
        tvManager.currentType = type;
        tvManager.searchQuery = '';
        
        let data;
        if (type === 'trending') {
            data = await tvManager.getTrendingTVShows(1);
        } else if (type === 'popular') {
            data = await tvManager.getPopularTVShows(1);
        } else if (type === 'top-rated') {
            data = await tvManager.getTopRatedTVShows(1);
        }

        displayTVSeries(data.results, false);
        setupTVScrollObserver();
    } catch (error) {
        console.error('Error loading TV series:', error);
        movieGrid.innerHTML = '<p style="text-align: center; color: red;">Failed to load TV series. Please try again.</p>';
    }
}

async function loadMoreTVShows() {
    if (tvManager.isLoading || !tvManager.hasMorePages) return;
    
    tvManager.currentPage++;
    
    try {
        let data;
        if (tvManager.currentType === 'search') {
            data = await tvManager.searchTVShows(tvManager.searchQuery, tvManager.currentPage);
        } else if (tvManager.currentType === 'trending') {
            data = await tvManager.getTrendingTVShows(tvManager.currentPage);
        } else if (tvManager.currentType === 'popular') {
            data = await tvManager.getPopularTVShows(tvManager.currentPage);
        } else if (tvManager.currentType === 'top-rated') {
            data = await tvManager.getTopRatedTVShows(tvManager.currentPage);
        }
        
        tvManager.hasMorePages = tvManager.currentPage < data.totalPages;
        appendTVSeries(data.results);
    } catch (error) {
        console.error('Error loading more TV shows:', error);
    }
}

function setupTVScrollObserver() {
    // Remove old observer if exists
    const oldSentinel = document.getElementById('tv-scroll-sentinel');
    if (oldSentinel) oldSentinel.remove();
    
    // Create new sentinel for TV scroll
    const tvSentinel = document.createElement('div');
    tvSentinel.id = 'tv-scroll-sentinel';
    document.body.appendChild(tvSentinel);

    const observerOptions = {
        root: null,
        rootMargin: '100px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && tvManager.hasMorePages && !tvManager.isLoading) {
                loadMoreTVShows();
            }
        });
    }, observerOptions);

    observer.observe(tvSentinel);
}

function displayTVSeries(series, isSearch = false) {
    const movieGrid = document.querySelector('.movie-grid');
    
    if (isSearch) {
        movieGrid.innerHTML = ''; // Clear for search
    }

    if (!series || series.length === 0) {
        if (isSearch || movieGrid.children.length === 0) {
            movieGrid.innerHTML = '<p style="text-align: center; color: #999; grid-column: 1/-1;">No TV series found.</p>';
        }
        return;
    }

    // Store current TV shows for filtering
    currentTVShows = series;
    appendTVSeries(series);
    
    if (!isSearch) {
        setupTVScrollObserver();
    }
}

function appendTVSeries(series) {
    const movieGrid = document.querySelector('.movie-grid');
    
    series.forEach(show => {
        const card = document.createElement('div');
        card.className = 'movie';
        const genreName = getGenreNameFromIds(show.genres);
        card.setAttribute('data-genre', genreName);
        card.setAttribute('data-type', 'tv');
        
        card.innerHTML = `
            <img src="https://image.tmdb.org/t/p/w500${show.poster}" alt="${show.title} Poster" loading="lazy" style="cursor: pointer;">
            <h2>${show.title}</h2>
            <p><strong>Rating:</strong> ${show.rating ? show.rating.toFixed(1) : 'N/A'}/10</p>
            ${show.firstAirDate ? `<p><strong>Year:</strong> ${new Date(show.firstAirDate).getFullYear()}</p>` : ''}
            <span style="font-size: 0.8em; color: #66cdaa; margin-top: 5px;">📺 ${genreName}</span>
        `;
        card.addEventListener('click', async () => {
            try {
                const details = await tvManager.getTVShowDetails(show.id);
                showTVModal(details);
            } catch (error) {
                console.error('Error showing TV details:', error);
            }
        });
        movieGrid.appendChild(card);
    });
}

function showTVModal(show) {
    const movieModal = document.getElementById('movieModal');
    const modalDetails = movieModal.querySelector('.modal-details');
    const modalPoster = movieModal.querySelector('#modalPoster');

    if (!show) return;

    const trailer = show.videos?.find(v => v.type === 'Trailer');
    const trailerHTML = trailer ? `
        <div id="trailer-container">
            <iframe width="100%" height="280" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
    ` : '';

    modalDetails.innerHTML = `
        <h2>${show.title}</h2>
        <p><strong>Status:</strong> ${show.status || 'N/A'}</p>
        <p><strong>First Air Date:</strong> ${show.firstAirDate || 'N/A'}</p>
        ${show.lastAirDate ? `<p><strong>Last Air Date:</strong> ${show.lastAirDate}</p>` : ''}
        <p><strong>Networks:</strong> ${show.network || 'N/A'}</p>
        <p><strong>Seasons:</strong> ${show.seasons?.length || 'N/A'}</p>
        <p><strong>Episodes:</strong> ${show.episodes || 'N/A'}</p>
        <p><strong>Rating:</strong> ${show.rating ? show.rating.toFixed(1) : 'N/A'}/10</p>
        <p><strong>Genres:</strong> ${show.genres?.map(g => g.name).join(', ') || 'N/A'}</p>
        <p><strong>Overview:</strong></p>
        <p>${show.overview || 'N/A'}</p>
        ${trailerHTML}
    `;

    modalPoster.src = `https://image.tmdb.org/t/p/w300${show.poster}`;
    movieModal.style.display = 'block';
}

function initializeAllFeatures() {
    console.log('initializeAllFeatures called');
    
    try {
        setupFeatureButtons();
    } catch (error) {
        console.error('setupFeatureButtons failed:', error);
    }

    try {
        setupWatchlistUI();
    } catch (error) {
        console.error('setupWatchlistUI failed:', error);
    }

    try {
        setupRatingsUI();
    } catch (error) {
        console.error('setupRatingsUI failed:', error);
    }

    try {
        setupSharingUI();
    } catch (error) {
        console.error('setupSharingUI failed:', error);
    }

    try {
        setupCollectionsUI();
    } catch (error) {
        console.error('setupCollectionsUI failed:', error);
    }

    try {
        setupTVShowsUI();
    } catch (error) {
        console.error('setupTVShowsUI failed:', error);
    }

    try {
        setupNotificationIntegration();
    } catch (error) {
        console.error('setupNotificationIntegration failed:', error);
    }

    try {
        setupSearchAutocomplete();
    } catch (error) {
        console.error('setupSearchAutocomplete failed:', error);
    }
    
    console.log('✅ Feature initialization complete.');
}

// ====== FEATURE BUTTONS IN SHOWCASE ======
function setupFeatureButtons() {
    console.log('Setting up feature buttons...');
    
    // Collections button
    const collectionsBtn = document.getElementById('view-collections-btn');
    if (collectionsBtn) {
        console.log('Collections button found');
        collectionsBtn.addEventListener('click', () => {
            try {
                showCollectionsModal();
            } catch (e) {
                console.error('Error in collections:', e);
                notificationManager?.error?.('Error', 'Failed to open collections');
            }
        });
        collectionsBtn.addEventListener('mouseover', function() {
            this.style.background = 'rgba(0, 191, 255, 0.3)';
            this.style.transform = 'translateY(-2px)';
        });
        collectionsBtn.addEventListener('mouseout', function() {
            this.style.background = 'rgba(0, 191, 255, 0.2)';
            this.style.transform = 'translateY(0)';
        });
    } else {
        console.warn('Collections button NOT found');
    }

    // Watchlist button
    const watchlistBtn = document.getElementById('open-watchlist-feature-btn');
    if (watchlistBtn) {
        console.log('Watchlist button found');
        watchlistBtn.addEventListener('click', () => {
            try {
                const favoritesBtn = document.getElementById('favorites-btn');
                if (favoritesBtn) favoritesBtn.click();
            } catch (e) {
                console.error('Error in watchlist:', e);
                notificationManager?.error?.('Error', 'Failed to open watchlist');
            }
        });
        watchlistBtn.addEventListener('mouseover', function() {
            this.style.background = 'rgba(255, 107, 107, 0.3)';
            this.style.transform = 'translateY(-2px)';
        });
        watchlistBtn.addEventListener('mouseout', function() {
            this.style.background = 'rgba(255, 107, 107, 0.2)';
            this.style.transform = 'translateY(0)';
        });
    } else {
        console.warn('Watchlist button NOT found');
    }

    // TV Shows button
    const tvBtn = document.getElementById('toggle-tv-shows-btn');
    if (tvBtn) {
        console.log('TV Shows button found');
        tvBtn.addEventListener('click', async () => {
            console.log('[UIIntegration] ===== TV BUTTON CLICKED =====');
            try {
                // Set search mode and suggestions to TV mode
                window.currentSearchMode = 'tv';
                console.log('[UIIntegration] Set currentSearchMode to "tv"');
                
                // Clear search input and hide suggestions
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.value = '';
                    console.log('[UIIntegration] Cleared search input');
                } else {
                    console.warn('[UIIntegration] Search input not found!');
                }
                const suggestionsContainer = document.getElementById('suggestions-container');
                if (suggestionsContainer) {
                    suggestionsContainer.style.display = 'none';
                    console.log('[UIIntegration] Hid suggestions container');
                } else {
                    console.log('[UIIntegration] Suggestions container not found (will be created on first input)');
                }
                
                if (window.searchSuggestions) {
                    console.log('[UIIntegration] searchSuggestions exists, calling setMode("tv")');
                    window.searchSuggestions.setMode('tv');
                    console.log('[UIIntegration] searchSuggestions mode set to tv');
                } else {
                    console.error('[UIIntegration] searchSuggestions NOT available!');
                }
                
                console.log('[UIIntegration] Getting trending TV shows...');
                const tvShows = await tvManager.getTrendingTVShows(12);
                console.log('[UIIntegration] Got TV shows, displaying...');
                displayContentInGrid(tvShows);
                notificationManager.info('📺 TV Shows Loaded', 'Showing trending TV series');
                console.log('[UIIntegration] TV Shows display complete');
            } catch (e) {
                console.error('[UIIntegration] Error in TV shows:', e);
                notificationManager?.error?.('Error', 'Failed to load TV shows');
            }
        });
        tvBtn.addEventListener('mouseover', function() {
            this.style.background = 'rgba(102, 205, 170, 0.3)';
            this.style.transform = 'translateY(-2px)';
        });
        tvBtn.addEventListener('mouseout', function() {
            this.style.background = 'rgba(102, 205, 170, 0.2)';
            this.style.transform = 'translateY(0)';
        });
    } else {
        console.warn('TV Shows button NOT found');
    }

    // Ratings button
    const ratingsBtn = document.getElementById('view-ratings-btn');
    if (ratingsBtn) {
        console.log('Ratings button found');
        ratingsBtn.addEventListener('click', () => {
            try {
                const allRatings = ratingsSystem.getAllRatings();
                const topRated = ratingsSystem.getTopRatedMovies(10);
                showRatingsOverview(topRated);
            } catch (e) {
                console.error('Error in ratings:', e);
                notificationManager?.error?.('Error', 'Failed to load ratings');
            }
        });
        ratingsBtn.addEventListener('mouseover', function() {
            this.style.background = 'rgba(229, 189, 9, 0.3)';
            this.style.transform = 'translateY(-2px)';
        });
        ratingsBtn.addEventListener('mouseout', function() {
            this.style.background = 'rgba(229, 189, 9, 0.2)';
            this.style.transform = 'translateY(0)';
        });
    } else {
        console.warn('Ratings button NOT found');
    }

    // Recommendations button
    const recsBtn = document.getElementById('view-recommendations-btn');
    if (recsBtn) {
        console.log('Recommendations button found');
        recsBtn.addEventListener('click', async () => {
            try {
                const trending = await recommendationsEngine.getTrendingMovies(12);
                displayContentInGrid(trending);
                notificationManager.info('🔥 Trending Now', 'Showing this week\'s hottest movies');
            } catch (e) {
                console.error('Error in recommendations:', e);
                notificationManager?.error?.('Error', 'Failed to load recommendations');
            }
        });
        recsBtn.addEventListener('mouseover', function() {
            this.style.background = 'rgba(158, 155, 254, 0.3)';
            this.style.transform = 'translateY(-2px)';
        });
        recsBtn.addEventListener('mouseout', function() {
            this.style.background = 'rgba(158, 155, 254, 0.2)';
            this.style.transform = 'translateY(0)';
        });
    } else {
        console.warn('Recommendations button NOT found');
    }

    // Profiles button
    const profilesBtn = document.getElementById('view-profiles-btn');
    if (profilesBtn) {
        console.log('Profiles button found');
        profilesBtn.addEventListener('click', () => {
            try {
                notificationManager.info('👤 Profiles Feature', 'Browse and discover actors and directors');
            } catch (e) {
                console.error('Error in profiles:', e);
                notificationManager?.error?.('Error', 'Failed to open profiles');
            }
        });
        profilesBtn.addEventListener('mouseover', function() {
            this.style.background = 'rgba(255, 161, 216, 0.3)';
            this.style.transform = 'translateY(-2px)';
        });
        profilesBtn.addEventListener('mouseout', function() {
            this.style.background = 'rgba(255, 161, 216, 0.2)';
            this.style.transform = 'translateY(0)';
        });
    } else {
        console.warn('Profiles button NOT found');
    }
}

function showRatingsOverview(topRated) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, rgba(30, 30, 30, 0.98) 0%, rgba(28, 28, 28, 0.98) 100%);
        padding: 30px;
        border-radius: 15px;
        border: 1px solid rgba(229, 189, 9, 0.3);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
        z-index: 3000;
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
    `;

    const allRatings = ratingsSystem.getAllRatings();
    const avgRating = ratingsSystem.averageRating();

    modal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: var(--accent-gold); margin: 0;">⭐ Your Ratings</h2>
            <button onclick="this.closest('div').parentElement.parentElement.remove()" style="background: none; border: none; color: #aaa; font-size: 2em; cursor: pointer;">&times;</button>
        </div>

        <div style="background: rgba(229, 189, 9, 0.1); padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 1px solid rgba(229, 189, 9, 0.3);">
            <p style="margin: 5px 0;"><strong style="color: var(--accent-gold);">Total Rated:</strong> ${Object.keys(allRatings).length} movies</p>
            <p style="margin: 5px 0;"><strong style="color: var(--accent-gold);">Average Rating:</strong> ${avgRating}/10 ⭐</p>
        </div>

        ${topRated.length > 0 ? `
            <h3 style="color: var(--accent-blue); margin-bottom: 15px;">Top Rated by You</h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                ${topRated.map(r => `
                    <div style="background: rgba(42, 42, 42, 0.6); padding: 12px; border-radius: 8px; border-left: 3px solid var(--accent-gold);">
                        <strong style="color: #ffcc00;">${r.movieTitle}</strong>
                        <div style="color: var(--accent-gold); font-weight: 600; margin-top: 5px;">⭐ ${r.rating}/10</div>
                    </div>
                `).join('')}
            </div>
        ` : `
            <p style="color: #999; text-align: center; padding: 20px;">No ratings yet. Start rating movies! 🎬</p>
        `}
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// ====== WATCHLIST INTEGRATION ======
function setupWatchlistUI() {
    if (typeof watchlistManager === 'undefined') {
        console.warn('watchlistManager is not available; skipping watchlist setup.');
        return;
    }

    const favoritesBtn = document.getElementById('favorites-btn');
    
    if (favoritesBtn) {
        // First ensure watchlist panel exists
        if (!document.getElementById('watchlist-panel')) {
            watchlistManager.renderWatchlistUI();
        }

        favoritesBtn.addEventListener('click', () => {
            const panel = document.getElementById('watchlist-panel');
            if (panel) {
                const isOpen = panel.style.right === '20px';
                panel.style.right = isOpen ? '-400px' : '20px';
            }
        });

        // Update badge from watchlist
        const stats = watchlistManager.getTotalStats();
        const badge = document.getElementById('favorites-badge');
        if (badge && stats.totalMovies > 0) {
            badge.textContent = stats.totalMovies;
        }
    }

    if (typeof watchlistManager.subscribe === 'function') {
        watchlistManager.subscribe((action, movieId) => {
            const stats = watchlistManager.getTotalStats();
            const badge = document.getElementById('favorites-badge');
            if (badge) {
                badge.textContent = stats.totalMovies > 0 ? stats.totalMovies : '';
            }
        });
    }

    // Setup remove from watchlist listeners
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-from-watchlist')) {
            const movieId = e.target.getAttribute('data-id');
            const category = e.target.getAttribute('data-category');
            if (typeof watchlistManager !== 'undefined') {
                watchlistManager.removeFromWatchlist(movieId, category);
                watchlistManager.renderWatchlistUI();
            }
            notificationManager?.removedFromWatchlist?.('Movie');
        }
    });
}

// ====== RATINGS INTEGRATION ======
function setupRatingsUI() {
    // Watch for movie modal opening
    const movieModal = document.getElementById('movieModal');
    if (!movieModal) return;

    // Use MutationObserver to detect when modal is shown
    const observer = new MutationObserver(() => {
        if (movieModal.style.display === 'block') {
            addActionButtonsToModal();
        }
    });

    observer.observe(movieModal, { attributes: true, attributeFilter: ['style'] });
}

function addActionButtonsToModal() {
    const modalDetails = document.querySelector('.modal-details');
    if (!modalDetails) return;

    // Get movie title from modal
    const movieTitle = modalDetails.querySelector('h2')?.textContent || 'Movie';
    const movieId = modalDetails.getAttribute('data-movie-id');
    
    // Check if buttons already exist
    if (document.getElementById('modal-action-buttons')) return;

    // Create action buttons container
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'modal-action-buttons';
    buttonContainer.style.cssText = `
        display: flex;
        gap: 10px;
        margin-top: 20px;
        flex-wrap: wrap;
    `;

    // Add to Watchlist button
    const watchlistBtn = document.createElement('button');
    watchlistBtn.textContent = '❤️ Add to Watchlist';
    watchlistBtn.style.cssText = `
        flex: 1;
        min-width: 150px;
        padding: 10px 20px;
        background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
        border: none;
        color: white;
        border-radius: 20px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
    `;

    watchlistBtn.addEventListener('mouseover', () => {
        watchlistBtn.style.transform = 'translateY(-2px)';
        watchlistBtn.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.4)';
    });

    watchlistBtn.addEventListener('mouseout', () => {
        watchlistBtn.style.transform = 'translateY(0)';
        watchlistBtn.style.boxShadow = 'none';
    });

    watchlistBtn.addEventListener('click', () => {
        const modalPoster = document.getElementById('modalPoster');
        const posterPath = modalPoster?.src.split('/w500').pop() || '/placeholder.jpg';
        
        showWatchlistCategories(movieId || Date.now(), movieTitle, posterPath);
    });

    // Rate & Review button
    const rateBtn = document.createElement('button');
    rateBtn.textContent = '⭐ Rate & Review';
    rateBtn.style.cssText = `
        flex: 1;
        min-width: 150px;
        padding: 10px 20px;
        background: linear-gradient(135deg, #e5bd09 0%, #ffcc00 100%);
        border: none;
        color: #000;
        border-radius: 20px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
    `;

    rateBtn.addEventListener('mouseover', () => {
        rateBtn.style.transform = 'translateY(-2px)';
        rateBtn.style.boxShadow = '0 6px 20px rgba(229, 189, 9, 0.5)';
    });

    rateBtn.addEventListener('mouseout', () => {
        rateBtn.style.transform = 'translateY(0)';
        rateBtn.style.boxShadow = 'none';
    });

    rateBtn.addEventListener('click', () => {
        showRatingModal(movieId || Date.now(), movieTitle);
    });

    buttonContainer.appendChild(watchlistBtn);
    buttonContainer.appendChild(rateBtn);
    
    // Insert before modal details content
    const firstP = modalDetails.querySelector('p');
    if (firstP) {
        modalDetails.insertBefore(buttonContainer, firstP);
    } else {
        modalDetails.appendChild(buttonContainer);
    }
}

function showWatchlistCategories(movieId, movieTitle, posterPath) {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, rgba(30, 30, 30, 0.98) 0%, rgba(28, 28, 28, 0.98) 100%);
        padding: 30px;
        border-radius: 15px;
        border: 1px solid rgba(0, 191, 255, 0.3);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
        z-index: 3000;
        min-width: 350px;
    `;

    const categories = Object.keys(watchlistManager.watchlists);
    
    dialog.innerHTML = `
        <h3 style="color: var(--accent-blue); margin-top: 0; margin-bottom: 15px;">Add to Watchlist</h3>
        <div style="display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto;">
            ${categories.map(cat => `
                <button class="category-btn" data-category="${cat}" style="
                    padding: 10px 15px;
                    background: rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.2);
                    border: 1px solid rgba(0, 191, 255, 0.3);
                    color: var(--accent-blue);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-weight: 600;
                ">
                    ${cat} (${watchlistManager.watchlists[cat].movies.length})
                </button>
            `).join('')}
        </div>
        <div style="display: flex; gap: 10px; margin-top: 15px;">
            <button class="cancel-category-btn" style="
                flex: 1;
                padding: 10px;
                background: rgba(100, 100, 100, 0.3);
                border: 1px solid #666;
                color: #ccc;
                border-radius: 8px;
                cursor: pointer;
            ">Cancel</button>
        </div>
    `;

    document.body.appendChild(dialog);

    // Setup category buttons
    dialog.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.getAttribute('data-category');
            watchlistManager.addToWatchlist(movieId, movieTitle, posterPath, category);
            notificationManager.addedToWatchlist(movieTitle);
            dialog.remove();
        });

        btn.addEventListener('mouseover', () => {
            btn.style.background = 'rgba(0, 191, 255, 0.2)';
            btn.style.borderColor = 'var(--accent-blue)';
        });

        btn.addEventListener('mouseout', () => {
            btn.style.background = 'rgba(100, 100, 100, 0.1)';
            btn.style.borderColor = 'rgba(0, 191, 255, 0.3)';
        });
    });

    dialog.querySelector('.cancel-category-btn').addEventListener('click', () => {
        dialog.remove();
    });
}

// ====== SHARING INTEGRATION ======
function setupSharingUI() {
    // Add share button to watchlist panel
    setTimeout(() => {
        const watchlistPanel = document.getElementById('watchlist-panel');
        if (watchlistPanel && !document.getElementById('share-btn-in-watchlist')) {
            const shareBtn = document.createElement('button');
            shareBtn.id = 'share-btn-in-watchlist';
            shareBtn.textContent = '🔗 Share Watchlist';
            shareBtn.style.cssText = `
                position: absolute;
                top: 70px;
                right: 15px;
                padding: 8px 16px;
                background: linear-gradient(135deg, var(--accent-blue) 0%, #0099cc 100%);
                border: none;
                color: white;
                border-radius: 20px;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.85em;
                z-index: 1000;
            `;

            shareBtn.addEventListener('click', () => {
                showShareModal();
            });

            watchlistPanel.appendChild(shareBtn);
        }
    }, 1000);
}

function showShareModal() {
    const existingModal = document.getElementById('share-modal');
    if (existingModal) existingModal.remove();

    const shareModal = sharingManager.generateShareModal();
    document.body.insertAdjacentHTML('beforeend', shareModal);

    // Setup export buttons
    document.querySelectorAll('.export-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const format = btn.getAttribute('data-format');
            if (format === 'json') sharingManager.exportAsJSON();
            else if (format === 'csv') sharingManager.exportAsCSV();
            else if (format === 'html') sharingManager.exportAsHTML();
            notificationManager.exportComplete();
        });
    });

    // Close button
    document.querySelector('.close-share-modal')?.addEventListener('click', () => {
        document.querySelector('[id="share-modal-"]')?.remove() || 
        document.querySelectorAll('.modal').forEach(m => {
            if (m.style.display !== 'none') m.remove();
        });
    });
}

// ====== COLLECTIONS INTEGRATION ======
function setupCollectionsUI() {
    // Add collections section after controls
    setTimeout(() => {
        const controlsSection = document.getElementById('controls-section');
        if (controlsSection && !document.getElementById('collections-section-btn')) {
            const collectionsBtn = document.createElement('button');
            collectionsBtn.id = 'collections-section-btn';
            collectionsBtn.textContent = '🎬 View Curated Collections';
            collectionsBtn.style.cssText = `
                display: block;
                width: 200px;
                margin: 20px auto;
                padding: 12px 24px;
                background: linear-gradient(135deg, #ffd93d 0%, #e5bd09 100%);
                border: none;
                color: #000;
                border-radius: 25px;
                cursor: pointer;
                font-weight: 700;
                font-size: 1em;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(255, 201, 61, 0.3);
            `;

            collectionsBtn.addEventListener('mouseover', () => {
                collectionsBtn.style.transform = 'translateY(-3px)';
                collectionsBtn.style.boxShadow = '0 8px 25px rgba(255, 201, 61, 0.5)';
            });

            collectionsBtn.addEventListener('mouseout', () => {
                collectionsBtn.style.transform = 'translateY(0)';
                collectionsBtn.style.boxShadow = '0 4px 15px rgba(255, 201, 61, 0.3)';
            });

            collectionsBtn.addEventListener('click', () => {
                showCollectionsModal();
            });

            controlsSection.parentElement.insertBefore(collectionsBtn, controlsSection.nextSibling);
        }
    }, 500);
}

async function showCollectionsModal() {
    const existingModal = document.querySelector('.collections-modal');
    if (existingModal) existingModal.remove();

    const collectionsHtml = collectionsManager.renderCollectionsGrid();
    const collectionsModal = document.createElement('div');
    collectionsModal.className = 'collections-modal';
    collectionsModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        z-index: 1000;
        overflow-y: auto;
        padding: 40px 20px;
    `;
    collectionsModal.innerHTML = collectionsHtml;
    document.body.appendChild(collectionsModal);

    // Handle back to home button
    const backHomeBtn = collectionsModal.querySelector('.back-to-home-btn');
    if (backHomeBtn) {
        backHomeBtn.addEventListener('click', () => {
            collectionsModal.remove();
        });
    }

    // Setup collection card clicks
    document.querySelectorAll('.view-collection-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const collectionName = btn.getAttribute('data-collection');
            const modal = await collectionsManager.renderCollectionModal(collectionName);
            
            const detailModal = document.createElement('div');
            detailModal.className = 'modal';
            detailModal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.9);
                z-index: 2000;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow-y: auto;
                padding: 20px;
            `;
            detailModal.innerHTML = modal;
            document.body.appendChild(detailModal);

            // Handle back to collections button
            const backBtn = detailModal.querySelector('.back-to-collections-btn');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    detailModal.remove();
                });
            }

            // Handle close button (if exists from previous implementation)
            detailModal.querySelector('.close')?.addEventListener('click', () => {
                detailModal.remove();
            });

            // Handle clicking outside
            detailModal.addEventListener('click', (e) => {
                if (e.target === detailModal) detailModal.remove();
            });

            // Handle movie clicks to open movie details
            detailModal.querySelectorAll('[data-movie-id]').forEach(movieEl => {
                movieEl.addEventListener('click', async () => {
                    const movieId = movieEl.getAttribute('data-movie-id');
                    try {
                        const response = await fetch(`${window.PROXY_BASE_URL}/api/movies?endpoint=${encodeURIComponent(`/3/movie/${movieId}?language=en-US`)}`);
                        const movieData = await response.json();
                        
                        // Show movie details modal
                        const movieModal = document.getElementById('movieModal');
                        if (movieModal) {
                            document.getElementById('modalPoster').src = `https://image.tmdb.org/t/p/w500${movieData.poster_path}`;
                            
                            let detailsHtml = `
                                <h2>${movieData.title} (${movieData.release_date?.substring(0, 4)})</h2>
                                <p><strong>Rating:</strong> ⭐ ${movieData.vote_average.toFixed(1)}/10</p>
                                <p><strong>Overview:</strong> ${movieData.overview}</p>
                                <p><strong>Runtime:</strong> ${movieData.runtime} minutes</p>
                                <p><strong>Genres:</strong> ${movieData.genres.map(g => g.name).join(', ')}</p>
                            `;
                            
                            document.querySelector('.modal-details').innerHTML = detailsHtml;
                            movieModal.style.display = 'block';
                        }
                    } catch (error) {
                        console.error('Error fetching movie details:', error);
                    }
                });
            });
        });
    });

    // Close on click outside
    collectionsModal.addEventListener('click', (e) => {
        if (e.target === collectionsModal) collectionsModal.remove();
    });
}

// ====== TV SHOWS INTEGRATION ======
function setupTVShowsUI() {
    const discoveryTabs = document.querySelectorAll('.discovery-tab');
    
    discoveryTabs.forEach(tab => {
        tab.addEventListener('click', async () => {
            const tabName = tab.getAttribute('data-tab');
            
            if (tabName === 'tv-shows') {
                const tvShows = await tvManager.getTrendingTVShows();
                displayContent(tvShows, 'TV Shows');
            }
        });
    });

    // TV Shows tab removed - no longer adding to discovery tabs
    // const discoveryTabsContainer = document.getElementById('discovery-tabs');
    // if (discoveryTabsContainer && !discoveryTabsContainer.querySelector('[data-tab="tv-shows"]')) {
    //     const tvTab = document.createElement('button');
    //     tvTab.className = 'discovery-tab';
    //     tvTab.setAttribute('data-tab', 'tv-shows');
    //     tvTab.textContent = 'TV Shows';
    //     tvTab.addEventListener('click', async () => {
    //         const tvShows = await tvManager.getTrendingTVShows();
    //         displayContentInGrid(tvShows);
    //     });
    //     discoveryTabsContainer.appendChild(tvTab);
    // }
}

async function displayContentInGrid(items) {
    const movieGrid = document.querySelector('.movie-grid');
    const spinner = document.querySelector('.spinner');
    if (!movieGrid) return;

    movieGrid.innerHTML = items.map(item => tvManager.renderTVShowCard(item)).join('');
    
    // Hide spinner after displaying content
    if (spinner) spinner.style.display = 'none';

    // Add click handlers to TV cards
    document.querySelectorAll('.tv-card').forEach(card => {
        card.addEventListener('click', async () => {
            const tvId = card.getAttribute('data-tv-id');
            const tvDetails = await tvManager.getTVShowDetails(tvId);
            if (tvDetails) {
                showTVModal(tvDetails);
            }
        });
    });
}

function showTVModal(tvShow) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.innerHTML = `<div class="modal-content">${tvManager.renderTVShowModal(tvShow)}</div>`;
    document.body.appendChild(modal);

    modal.querySelector('.close')?.addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// ====== SEARCH AUTOCOMPLETE ======
function setupSearchAutocomplete() {
    console.log('[setupSearchAutocomplete] Starting search autocomplete setup...');
    
    if (typeof searchSuggestions === 'undefined') {
        console.error('[setupSearchAutocomplete] searchSuggestions class not available!');
        return;
    }
    
    // Setup autocomplete for MOVIE search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        console.log('[setupSearchAutocomplete] Found movie search input, setting up autocomplete...');
        searchSuggestions.setupAutocomplete(searchInput);
        
        // Handle autocomplete selection for movies
        searchInput.addEventListener('autocomplete-select', () => {
            console.log('[setupSearchAutocomplete] Movie autocomplete selection');
            const searchButton = document.getElementById('search-button');
            if (searchButton) {
                searchButton.click();
            }
        });
        console.log('[setupSearchAutocomplete] ✅ Movie autocomplete setup complete');
    } else {
        console.error('[setupSearchAutocomplete] Movie search input not found!');
    }
    
    // Setup autocomplete for TV search input
    const tvSearchInput = document.getElementById('tv-search-input');
    if (tvSearchInput) {
        console.log('[setupSearchAutocomplete] Found TV search input, setting up autocomplete...');
        searchSuggestions.setupAutocomplete(tvSearchInput);
        
        // Handle autocomplete selection for TV
        tvSearchInput.addEventListener('autocomplete-select', () => {
            console.log('[setupSearchAutocomplete] TV autocomplete selection');
            const tvSearchButton = document.getElementById('tv-search-button');
            if (tvSearchButton) {
                tvSearchButton.click();
            }
        });
        console.log('[setupSearchAutocomplete] ✅ TV autocomplete setup complete');
    } else {
        console.error('[setupSearchAutocomplete] TV search input not found!');
    }
}

// ====== NOTIFICATION INTEGRATION ======
function setupNotificationIntegration() {
    // Show welcome notification
    setTimeout(() => {
        notificationManager.info('Welcome to CineWorld!', 'Explore movies, TV shows, and build your watchlist.');
    }, 1000);

    // Watch for watchlist changes
    if (typeof watchlistManager !== 'undefined') {
        watchlistManager.subscribe((action, movieId) => {
            if (action === 'added') {
                notificationManager.success('Added to Watchlist', 'Movie saved successfully!');
            }
        });
    }
}

function showRatingModal(movieId, movieTitle) {
    if (!movieId || !movieTitle) {
        notificationManager.warning('Error', 'Movie data missing');
        return;
    }

    const modalHTML = ratingsSystem.renderRatingModal(movieId, movieTitle);
    
    const existingModal = document.getElementById(`rating-modal-${movieId}`);
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Setup star rating
    const stars = document.querySelectorAll(`#star-rating-${movieId} .star-btn`);
    let selectedRating = 0;

    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.getAttribute('data-rating'));
            stars.forEach((s, idx) => {
                s.style.color = idx < selectedRating ? '#ffcc00' : '#444';
            });
        });

        star.addEventListener('mouseover', () => {
            const rating = parseInt(star.getAttribute('data-rating'));
            stars.forEach((s, idx) => {
                s.style.color = idx < rating ? '#ffcc00' : '#444';
            });
        });
    });

    document.addEventListener('mouseout', () => {
        stars.forEach((s, idx) => {
            s.style.color = idx < selectedRating ? '#ffcc00' : '#444';
        });
    });

    // Submit button
    const submitBtn = document.querySelector(`[data-movie-id="${movieId}"].submit-review-btn`);
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            if (selectedRating > 0) {
                ratingsSystem.addRating(movieId, movieTitle, selectedRating);
                
                const reviewText = document.getElementById(`review-text-${movieId}`)?.value || '';
                if (reviewText) {
                    const hasSpoilers = document.getElementById(`spoiler-warning-${movieId}`)?.checked || false;
                    ratingsSystem.addReview(movieId, movieTitle, reviewText, hasSpoilers);
                }
                
                notificationManager.savedRating(movieTitle, selectedRating);
                const modal = document.getElementById(`rating-modal-${movieId}`);
                if (modal) modal.remove();
            } else {
                notificationManager.warning('Select a rating', 'Please choose a star rating');
            }
        });
    }

    // Cancel button
    const cancelBtn = document.querySelector(`[data-movie-id="${movieId}"].cancel-review-btn`);
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            const modal = document.getElementById(`rating-modal-${movieId}`);
            if (modal) modal.remove();
        });
    }
}

// ====== EXPORT AND UTILITY ======
window.showCollectionsModal = showCollectionsModal;
window.showShareModal = showShareModal;
window.showRatingModal = showRatingModal;
