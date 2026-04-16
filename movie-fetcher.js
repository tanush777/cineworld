// File: movie-fetcher.js (Updated - COMPLETE REWRITE)

// --- BASE CONFIGURATION ---
// The script now talks to your server, not TMDB directly
const PROXY_BASE_URL = window.location.origin;
window.PROXY_BASE_URL = PROXY_BASE_URL; // Make globally accessible for features.js
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'; 
const YOUTUBE_EMBED_BASE = 'https://www.youtube.com/embed/';

const movieGrid = document.querySelector('.movie-grid');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const sortBySelect = document.getElementById('sort-by');
const loadMoreButton = document.getElementById('load-more-button');
const spinner = document.querySelector('.spinner');
const themeToggle = document.getElementById('theme-toggle');
const favoritesBtn = document.getElementById('favorites-btn');
const favoritesBadge = document.getElementById('favorites-badge');

// New UI Elements
const showFiltersBtn = document.getElementById('show-filters-btn');
const toggleFiltersBtn = document.getElementById('toggle-filters-btn');
const advancedFilters = document.getElementById('advanced-filters');
const yearFilter = document.getElementById('year-filter');
const ratingFilter = document.getElementById('rating-filter');
const discoveryTabs = document.querySelectorAll('.discovery-tab');
const searchHistory = document.getElementById('search-history');

// Modal Elements
const movieModal = document.getElementById('movieModal');
const modalClose = movieModal.querySelector('.close');

let genreCache = {};
let runtimeCache = {}; // Store runtimes fetched from modals
let currentPage = 1;
let currentEndpoint = '/3/discover/movie'; // Default: Discover
let currentDiscoveryTab = 'discover'; // Track which discovery tab is active
let currentQuery = ''; // Holds the search term if searching
let isLoading = false; // Flag to prevent multiple simultaneous requests
let hasMorePages = true; // Flag to track if there are more pages to load
let favorites = []; // Array to store favorite movie IDs
let isShowingFavorites = false; // Track if currently viewing favorites
let searches = []; // Store search history

// Make currentSearchMode global so it can be accessed from other files
window.currentSearchMode = 'movie'; // Track current search mode: 'movie' or 'tv'

// --- THEME MANAGEMENT ---
function initializeTheme() {
    const savedTheme = localStorage.getItem('cineworld-theme') || 'dark';
    document.body.className = savedTheme === 'light' ? 'light-theme' : '';
    updateThemeToggleButton();
}

function updateThemeToggleButton() {
    const isDarkMode = !document.body.classList.contains('light-theme');
    themeToggle.textContent = isDarkMode ? '☀️ Theme' : '🌙 Theme';
}

function toggleTheme() {
    const isDarkMode = !document.body.classList.contains('light-theme');
    if (isDarkMode) {
        document.body.classList.add('light-theme');
        localStorage.setItem('cineworld-theme', 'light');
    } else {
        document.body.classList.remove('light-theme');
        localStorage.setItem('cineworld-theme', 'dark');
    }
    updateThemeToggleButton();
}

// --- WATCHLIST/FAVORITES MANAGEMENT ---
function loadFavorites() {
    const saved = localStorage.getItem('cineworld-favorites');
    favorites = saved ? JSON.parse(saved) : [];
    updateFavoritesBadge();
}

function saveFavorites() {
    localStorage.setItem('cineworld-favorites', JSON.stringify(favorites));
    updateFavoritesBadge();
}

function updateFavoritesBadge() {
    const count = favorites.length;
    favoritesBadge.textContent = count > 0 ? count : '';
}

function toggleFavorite(movieId) {
    const index = favorites.indexOf(movieId);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(movieId);
    }
    saveFavorites();
    updateFavoriteButtons();
}

function isFavorite(movieId) {
    return favorites.includes(movieId);
}

function updateFavoriteButtons() {
    const buttons = document.querySelectorAll('.movie-favorite-btn');
    buttons.forEach(btn => {
        const movieId = parseInt(btn.closest('.movie').getAttribute('data-movie-id'));
        if (isFavorite(movieId)) {
            btn.classList.add('favorited');
            btn.textContent = '❤️';
        } else {
            btn.classList.remove('favorited');
            btn.textContent = '🤍';
        }
    });
}

// Handle adding movie to watchlist
function handleAddToWatchlist(movieId, movieTitle) {
    if (typeof watchlistManager !== 'undefined') {
        watchlistManager.addToWatchlist(movieId, movieTitle, 'to-watch');
        notificationManager?.addedToWatchlist?.('Movie Added', `${movieTitle} added to watchlist`);
        updateWatchlistButtonState(movieId);
    } else {
        alert('Watchlist feature is not available');
    }
}

// Update the favorite button state in modal
function updateFavoriteButtonState(movieId) {
    const btn = document.getElementById('add-to-favorites-btn');
    if (btn) {
        if (isFavorite(movieId)) {
            btn.textContent = '⭐ Added to Favorites';
            btn.style.background = 'rgba(229, 189, 9, 0.3)';
            btn.style.color = 'var(--accent-gold)';
        } else {
            btn.textContent = '⭐ Add to Favorites';
            btn.style.background = 'rgba(229, 189, 9, 0.1)';
            btn.style.color = 'var(--accent-gold)';
        }
    }
}

// Update the watchlist button state in modal
function updateWatchlistButtonState(movieId) {
    const btn = document.getElementById('add-to-watchlist-btn');
    if (btn) {
        btn.textContent = '❤️ Added to Watchlist';
        btn.style.opacity = '0.7';
        setTimeout(() => {
            btn.textContent = '❤️ Add to Watchlist';
            btn.style.opacity = '1';
        }, 2000);
    }
}

// --- SEARCH HISTORY MANAGEMENT ---
function loadSearchHistory() {
    const saved = localStorage.getItem('cineworld-searches');
    searches = saved ? JSON.parse(saved) : [];
}

function saveSearchHistory() {
    localStorage.setItem('cineworld-searches', JSON.stringify(searches.slice(0, 10))); // Keep last 10
}

function addToSearchHistory(query) {
    if (query && !searches.includes(query)) {
        searches.unshift(query);
        searches = searches.slice(0, 10); // Keep only last 10
        saveSearchHistory();
    }
}

function displaySearchHistory() {
    if (searches.length === 0) {
        searchHistory.style.display = 'none';
        return;
    }
    
    searchHistory.innerHTML = searches.map(search => 
        `<li data-search="${search}">🔍 ${search}</li>`
    ).join('');
    
    searchHistory.style.display = 'block';
    
    searchHistory.querySelectorAll('li').forEach(item => {
        item.addEventListener('click', () => {
            searchInput.value = item.getAttribute('data-search');
            searchMovies();
        });
    });
}

function hideSearchHistory() {
    searchHistory.style.display = 'none';
}

// --- KEYBOARD SHORTCUTS ---
function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
        // Press / to focus search input
        if (e.key === '/' && document.activeElement !== searchInput) {
            e.preventDefault();
            searchInput.focus();
        }
        // Press Esc to close modal
        if (e.key === 'Escape' && movieModal.style.display === 'block') {
            movieModal.style.display = 'none';
        }
    });
}

// --- ADVANCED FILTERS MANAGEMENT ---
function toggleAdvancedFilters() {
    const isVisible = advancedFilters.style.display === 'flex';
    if (isVisible) {
        advancedFilters.style.display = 'none';
        showFiltersBtn.style.display = 'block';
    } else {
        advancedFilters.style.display = 'flex';
        showFiltersBtn.style.display = 'none';
    }
}

function applyAdvancedFilters() {
    // Filters applied during fetchAndRenderMovies
    fetchAndRenderMovies(true);
}

// --- 1. CORE FETCHING LOGIC ---

// Fetch Genre List (Genre ID -> Name mapping)
async function fetchGenres() {
    if (Object.keys(genreCache).length > 0) return;
    try {
        // Fetch genres using the proxy endpoint
        const response = await fetch(`${PROXY_BASE_URL}/api/movies?endpoint=/3/genre/movie/list`); 
        const data = await response.json();
        data.genres.forEach(genre => {
            genreCache[genre.id] = genre.name;
        });
    } catch (error) {
        console.error("Error fetching genres:", error);
    }
}

// Fetches and renders movies based on current state
async function fetchAndRenderMovies(reset = true) {
    if (isLoading) return; // Prevent multiple simultaneous requests
    
    console.log('[fetchAndRenderMovies] Called with reset:', reset);
    if (reset) {
        currentPage = 1;
        movieGrid.innerHTML = '';
        loadMoreButton.style.display = 'none';
        hasMorePages = true;
        // Ensure genre filters are reset to 'All' or logic works
        document.querySelector('#genre-filters .active')?.classList.remove('active');
        document.querySelector('#genre-filters button[data-genre="all"]').classList.add('active');
    }
    
    if (!hasMorePages) return; // Exit if no more pages to load
    
    isLoading = true;
    spinner.style.display = 'block';
    console.log('[fetchAndRenderMovies] Spinner shown');

    await fetchGenres(); 

    // Build the query string for the server proxy
    let tmdbQuery = `&page=${currentPage}&language=en-US`;
    
    if (currentEndpoint === '/3/search/movie') {
        tmdbQuery += `&query=${encodeURIComponent(currentQuery)}`;
    } else {
        // For Discover endpoint, add sorting parameter
        tmdbQuery += `&sort_by=${sortBySelect.value}`;
    }

    // Add advanced filters
    const yearValue = yearFilter.value;
    if (yearValue) {
        tmdbQuery += `&primary_release_year=${yearValue}`;
    }

    const ratingValue = ratingFilter.value;
    if (ratingValue) {
        tmdbQuery += `&vote_average.gte=${ratingValue}`;
    }

    const fetchUrl = `${PROXY_BASE_URL}/api/movies?endpoint=${currentEndpoint}${tmdbQuery}`;
    
    try {
        const response = await fetch(fetchUrl);
        const data = await response.json();

        spinner.style.display = 'none';
        
        let moviesHTML = '';
        data.results.forEach(movie => {
            moviesHTML += createMovieCard(movie);
        });

        if (reset) {
            movieGrid.innerHTML = moviesHTML;
        } else {
            movieGrid.insertAdjacentHTML('beforeend', moviesHTML);
        }

        // Check if there are more pages
        if (data.total_pages > currentPage && data.results.length > 0) {
            hasMorePages = true;
            currentPage++;
        } else {
            hasMorePages = false;
        }

        if (reset && data.results.length === 0) {
            movieGrid.innerHTML = `<p style="text-align: center; color: yellow;">No results found for your criteria.</p>`;
            hasMorePages = false;
        }
        
        // Add event listeners for the new cards and genre filters
        addMovieCardListeners();
        // Re-initialize genre filters to apply to new movies
        window.initializeGenreFilters();
        console.log('[fetchAndRenderMovies] Successfully fetched and rendered movies');

    } catch (error) {
        console.error("Error fetching or rendering movies:", error);
        spinner.style.display = 'none';
        if (reset) {
            movieGrid.innerHTML = `<p style="text-align: center; color: red;">Failed to load movies. Server or API error.</p>`;
        }
        hasMorePages = false;
    } finally {
        isLoading = false;
        console.log('[fetchAndRenderMovies] Completed (isLoading set to false)');
    }
}

// --- 2. CARD RENDERING AND MODAL LOGIC ---

function createMovieCard(movie) {
    if (!movie.poster_path || !movie.title) return ''; 

    const primaryGenre = movie.genre_ids && movie.genre_ids.length > 0 ? genreCache[movie.genre_ids[0]] || 'Unknown' : 'Unknown';
    const movieGenresList = movie.genre_ids && movie.genre_ids.map(id => genreCache[id] || 'Unknown').join(', ') || 'N/A';
    const rating = movie.vote_average != null ? movie.vote_average.toFixed(1) : 'N/A';
    const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
    const isFavorited = isFavorite(movie.id);
    const heartIcon = isFavorited ? '❤️' : '🤍';
    
    // Get runtime from cache if available
    const runtime = runtimeCache[movie.id] ? `${Math.floor(runtimeCache[movie.id] / 60)}h ${runtimeCache[movie.id] % 60}m` : '';
    const runtimeHTML = runtime ? `<p class="movie-runtime">⏱️ ${runtime}</p>` : '';

    return `
        <div class="movie" data-genre="${primaryGenre}" data-movie-id="${movie.id}">
            <button class="movie-favorite-btn ${isFavorited ? 'favorited' : ''}" data-movie-id="${movie.id}" title="Add to Watchlist">${heartIcon}</button>
            <img src="${TMDB_IMAGE_BASE_URL}${movie.poster_path}" alt="${movie.title} Poster" loading="lazy">
            <h2>${movie.title} (${releaseYear})</h2>
            <p><strong>Genre:</strong> ${movieGenresList}</p>
            <p><strong>TMDB Rating:</strong> ${rating}</p>
            ${runtimeHTML}
        </div>
    `;
}

function addMovieCardListeners() {
    const movieCards = document.querySelectorAll('.movie'); 
    movieCards.forEach(card => {
        // Use a flag or check to avoid adding duplicate listeners
        if (!card.hasAttribute('data-listener-added')) {
            card.addEventListener('click', handleMovieCardClick);
            card.setAttribute('data-listener-added', 'true');
        }
    });

    // Add favorite button listeners
    const favoriteButtons = document.querySelectorAll('.movie-favorite-btn');
    favoriteButtons.forEach(btn => {
        if (!btn.hasAttribute('data-listener-added')) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click from triggering
                const movieId = parseInt(btn.getAttribute('data-movie-id'));
                toggleFavorite(movieId);
            });
            btn.setAttribute('data-listener-added', 'true');
        }
    });
}

function handleMovieCardClick(e) {
    const movieId = this.getAttribute('data-movie-id');
    if (movieId) {
        showMovieDetails(movieId);
    }
}

// --- 3. DETAILED MOVIE MODAL FETCHING ---

// Helper function to fetch and return watch providers HTML
async function fetchAndDisplayWatchProviders(movieId) {
    console.log('=== FETCH AND DISPLAY WATCH PROVIDERS DEBUG ===');
    console.log('fetchAndDisplayWatchProviders called for movie:', movieId);
    try {
        if (!window.fetchWatchProviders) {
            console.warn('❌ fetchWatchProviders not available');
            return '';
        }
        if (!window.displayWatchProviders) {
            console.warn('❌ displayWatchProviders not available');
            return '';
        }
        console.log('✓ Both functions available, calling fetchWatchProviders');
        const providers = await window.fetchWatchProviders(movieId);
        console.log('✓ fetchWatchProviders returned:', providers);
        const html = window.displayWatchProviders(providers);
        console.log('✓ displayWatchProviders generated HTML length:', html.length);
        console.log('Watch providers HTML generated:', !!html);
        console.log('=== END DEBUG ===');
        return html || '';
    } catch (error) {
        console.log('❌ Watch providers error:', error);
        console.log('Error stack:', error.stack);
        console.log('=== END DEBUG ===');
        return '';
    }
}

async function showMovieDetails(movieId) {
    const modalDetails = movieModal.querySelector('.modal-details');
    // Temporarily show spinner/loading message inside the modal content
    modalDetails.innerHTML = '<div class="spinner" style="display: block;"></div><p style="text-align: center; color: #fff;">Loading Details...</p>';
    // Also, temporarily set a blank poster and open the modal
    movieModal.querySelector('#modalPoster').src = '';
    movieModal.style.display = 'block';
    
    try {
        // Fetch detailed info (includes credits and videos) from the dedicated server proxy
        const response = await fetch(`${PROXY_BASE_URL}/api/movie-details/${movieId}`);
        const data = await response.json();
        
        // Cache the runtime for later display on cards
        runtimeCache[movieId] = data.runtime;
        
        // Extract Director and Cast
        const director = data.credits.crew.find(crew => crew.job === 'Director')?.name || 'N/A';
        const leadCast = data.credits.cast.slice(0, 3).map(cast => cast.name).join(', ') || 'N/A';
        
        // Find Trailer (YouTube)
        const trailer = data.videos.results.find(video => video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser'));
        const trailerHTML = trailer 
            ? `<div id="trailer-container"><iframe src="${YOUTUBE_EMBED_BASE}${trailer.key}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
            : `<div id="trailer-container"><p style="color: #ccc;">No trailer found for this movie.</p></div>`;

        // Format Runtime
        const runtime = data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : 'N/A';
        
        // Fetch similar movies
        const similarResponse = await fetch(`${PROXY_BASE_URL}/api/movies?endpoint=/3/movie/${movieId}/similar&page=1`);
        const similarData = await similarResponse.json();
        const similarMovies = similarData.results.slice(0, 5);
        
        let similarMoviesHTML = '';
        if (similarMovies.length > 0) {
            similarMoviesHTML = `
                <div id="similar-movies">
                    <h3>Similar Movies</h3>
                    <div class="similar-movie-row">
                        ${similarMovies.map(sim => `
                            <div class="similar-movie" onclick="showMovieDetails(${sim.id})">
                                <img src="${TMDB_IMAGE_BASE_URL}${sim.poster_path}" alt="${sim.title}" loading="lazy">
                                <p>${sim.title}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Load collections and comments on modal open
        if (window.loadCollections) loadCollections();
        if (window.loadComments) loadComments();
        
        // Generate feature sections using new features module
        let watchProvidersHTML = '';
        let productionDetailsHTML = '';
        let ratingsChartHTML = '';
        let sharButtonsHTML = '';
        let commentsHTML = '';
        
        if (window.displayWatchProviders) {
            watchProvidersHTML = await fetchAndDisplayWatchProviders(movieId);
        }
        if (window.displayProductionDetails) {
            productionDetailsHTML = displayProductionDetails(data);
        }
        if (window.displayRatingsChart) {
            ratingsChartHTML = displayRatingsChart(data);
        }
        if (window.displayShareButtons) {
            sharButtonsHTML = displayShareButtons(movieId, data.title);
        }
        if (window.displayComments) {
            commentsHTML = displayComments(movieId);
        }
        
        // Re-populate the modal with fetched data
        console.log('=== MODAL GENERATION DEBUG ===');
        console.log('watchProvidersHTML ready:', watchProvidersHTML.length, 'chars');
        console.log('watchProvidersHTML content:', watchProvidersHTML.substring(0, 100));
        
        modalDetails.innerHTML = `
            <h2 id="modalTitle">${data.title} (${new Date(data.release_date).getFullYear()})</h2>
            <div class="modal-action-buttons">
                <button id="add-to-watchlist-btn" onclick="handleAddToWatchlist(${movieId}, '${data.title}')" style="padding: 10px 20px; background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%); color: white; border: none; border-radius: 20px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; font-size: 0.95em;">❤️ Watchlist</button>
                <button id="add-to-favorites-btn" onclick="toggleFavorite(${movieId}); updateFavoriteButtonState(${movieId})" style="padding: 10px 20px; background: rgba(229, 189, 9, 0.2); color: var(--accent-gold); border: 1px solid rgba(229, 189, 9, 0.5); border-radius: 20px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; font-size: 0.95em;">⭐ Favorite</button>
            </div>
            <p><strong>Tagline:</strong> <span id="modalTagline">${data.tagline || 'N/A'}</span></p>
            <p><strong>Release Date:</strong> <span id="modalDate">${data.release_date || 'N/A'}</span></p>
            <p><strong>Runtime:</strong> <span id="modalRuntime">${runtime}</span></p>
            <p><strong>Rating:</strong> <span id="modalRating">${data.vote_average ? data.vote_average.toFixed(1) : 'N/A'}</span>/10</p>
            <p><strong>Genres:</strong> <span id="modalGenres">${data.genres.map(g => g.name).join(', ') || 'N/A'}</span></p>
            <p><strong>Director:</strong> <span id="modalDirector">${director}</span></p>
            <p><strong>Starring:</strong> <span id="modalCast">${leadCast}</span></p>
            <p><strong>Overview:</strong></p>
            <p id="modalOverview">${data.overview || 'N/A'}</p>
            
            ${ratingsChartHTML}
            
            ${watchProvidersHTML}
            
            ${productionDetailsHTML}
            
            ${trailerHTML}
            
            ${sharButtonsHTML}
            
            ${similarMoviesHTML}
            
            ${commentsHTML}
            
            <p style="margin-top: 15px;"><a id="modalTmdbLink" href="https://www.themoviedb.org/movie/${movieId}" target="_blank">View on TMDB</a></p>
        `;
        
        console.log('=== AFTER MODAL INJECTION ===');
        const watchProvidersDiv = document.getElementById('watch-providers');
        console.log('watch-providers div in DOM:', !!watchProvidersDiv);
        if (watchProvidersDiv) {
            console.log('watch-providers HTML content:', watchProvidersDiv.innerHTML.substring(0, 150));
        }
        console.log('=== END DEBUG ===');
        
        movieModal.querySelector('#modalPoster').src = `${TMDB_IMAGE_BASE_URL}${data.poster_path}`;

    } catch (error) {
        console.error("Error fetching movie details:", error);
        modalDetails.innerHTML = `<p style="text-align: center; color: red;">Failed to load details. Please try again.</p>`;
    }
}

// --- 4. EVENT LISTENERS AND INITIALIZATION ---

function searchMovies() {
    isShowingFavorites = false;
    favoritesBtn.style.opacity = '1';
    favoritesBtn.style.background = 'rgba(0, 191, 255, 0.1)';
    
    currentQuery = searchInput.value.trim();
    
    // Use the tracked search mode
    if (window.currentSearchMode === 'tv' && window.tvManager) {
        // Search for TV series
        window.tvManager.searchQuery = currentQuery;
        if (currentQuery) {
            addToSearchHistory(currentQuery);
            window.tvManager.currentType = 'search';
        }
        window.tvManager.currentPage = 1;
        const movieGrid = document.querySelector('.movie-grid');
        if (movieGrid) {
            movieGrid.innerHTML = '';
        }
        // Trigger TV show search
        if (window.searchTVShows) {
            window.searchTVShows();
        }
    } else {
        // Search for movies (original behavior)
        window.currentSearchMode = 'movie';
        if (currentQuery) {
            addToSearchHistory(currentQuery);
            currentEndpoint = '/3/search/movie';
        } else {
            currentEndpoint = '/3/discover/movie';
        }
        fetchAndRenderMovies(true);
    }
    hideSearchHistory();
}

function handleSortOrDiscoverChange() {
    isShowingFavorites = false;
    favoritesBtn.style.opacity = '1';
    favoritesBtn.style.background = 'rgba(0, 191, 255, 0.1)';
    
    // A sort change should always reset to the discover endpoint
    currentEndpoint = '/3/discover/movie';
    currentQuery = ''; // Clear search state
    searchInput.value = ''; // Clear search box for visual consistency
    fetchAndRenderMovies(true);
}

document.addEventListener("DOMContentLoaded", () => {
    // Initialize theme and favorites
    initializeTheme();
    loadFavorites();
    loadSearchHistory();

    // Initial load: fetch popular (default sort)
    fetchAndRenderMovies(true); 

    // Add event listeners for search
    searchButton.addEventListener('click', searchMovies);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchMovies();
        }
    });
    
    // Add event listener for sorting change
    sortBySelect.addEventListener('change', handleSortOrDiscoverChange);

    // Discovery tabs listeners
    discoveryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            console.log('[MovieFetcher] Movie tab clicked:', tab.getAttribute('data-tab'));
            // Switch back to movie mode when clicking movie tabs
            window.currentSearchMode = 'movie';
            console.log('[MovieFetcher] Set currentSearchMode to "movie"');
            
            // IMPORTANT: Reset isLoading flag to allow movies to load
            isLoading = false;
            console.log('[MovieFetcher] Reset isLoading flag to false');
            
            if (window.searchSuggestions) {
                window.searchSuggestions.setMode('movie');
                console.log('[MovieFetcher] Set search suggestions to movie mode');
            }
            
            // Remove active class from all tabs
            discoveryTabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');
            
            currentDiscoveryTab = tab.getAttribute('data-tab');
            
            // Set the endpoint based on tab
            switch(currentDiscoveryTab) {
                case 'trending':
                    currentEndpoint = '/3/trending/movie/week';
                    break;
                case 'popular':
                    currentEndpoint = '/3/movie/popular';
                    break;
                case 'top-rated':
                    currentEndpoint = '/3/movie/top_rated';
                    break;
                default:
                    currentEndpoint = '/3/discover/movie';
            }
            
            currentQuery = '';
            searchInput.value = '';
            console.log('[MovieFetcher] Calling fetchAndRenderMovies(true)');
            fetchAndRenderMovies(true);
        });
    });

    // Advanced filters listeners
    showFiltersBtn.addEventListener('click', toggleAdvancedFilters);
    toggleFiltersBtn.addEventListener('click', toggleAdvancedFilters);
    yearFilter.addEventListener('change', applyAdvancedFilters);
    ratingFilter.addEventListener('change', applyAdvancedFilters);

    // Theme toggle listener
    themeToggle.addEventListener('click', toggleTheme);

    // Favorites button listener
    favoritesBtn.addEventListener('click', () => {
        isShowingFavorites = !isShowingFavorites;
        if (isShowingFavorites) {
            favoritesBtn.style.opacity = '0.7';
            favoritesBtn.style.background = 'rgba(229, 189, 9, 0.3)';
            // Show only favorites
            document.querySelectorAll('.movie').forEach(movie => {
                const movieId = parseInt(movie.getAttribute('data-movie-id'));
                movie.style.display = isFavorite(movieId) ? 'flex' : 'none';
            });
        } else {
            favoritesBtn.style.opacity = '1';
            favoritesBtn.style.background = 'rgba(0, 191, 255, 0.1)';
            // Show all movies again
            document.querySelectorAll('.movie').forEach(movie => {
                movie.style.display = 'flex';
            });
            // Reset genre filter
            window.initializeGenreFilters();
        }
    });

    // Keyboard shortcuts
    setupKeyboardShortcuts();

    // Hide load more button - we'll use infinite scroll instead
    loadMoreButton.style.display = 'none';

    // Modal close listeners
    modalClose.addEventListener('click', () => movieModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === movieModal) {
            movieModal.style.display = 'none';
        }
    });

    // --- INFINITE SCROLL SETUP ---
    // Create a sentinel element at the bottom to detect when user scrolls near it
    const sentinel = document.createElement('div');
    sentinel.id = 'scroll-sentinel';
    document.body.appendChild(sentinel);

    // Intersection Observer to detect when user scrolls near the bottom
    const observerOptions = {
        root: null,
        rootMargin: '100px', // Load more movies when user is 100px from the bottom
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Only load more movies if we're in movies mode, not TV mode
            if (entry.isIntersecting && hasMorePages && !isLoading && currentContentType === 'movies') {
                fetchAndRenderMovies(false); // Load more without resetting
            }
        });
    }, observerOptions);

    observer.observe(sentinel);
});


// Expose a function to get movie elements, for use in genre.js
window.getMovies = () => document.querySelectorAll('.movie');

// === DEBUG & CLEANUP UTILITIES ===
// Call these in browser console to fix favorites count issues

window.debugFavorites = function() {
    console.log('=== FAVORITES DEBUG INFO ===');
    const saved = localStorage.getItem('cineworld-favorites');
    const favArray = saved ? JSON.parse(saved) : [];
    
    console.log('Total favorites:', favArray.length);
    console.log('Favorites array:', favArray);
    
    // Check for duplicates
    const uniqueFavs = [...new Set(favArray)];
    if (uniqueFavs.length !== favArray.length) {
        console.warn(`⚠️ DUPLICATES FOUND! ${favArray.length - uniqueFavs.length} duplicates detected`);
    } else {
        console.log('✓ No duplicates');
    }
    
    return favArray;
};

window.cleanupFavorites = function() {
    const saved = localStorage.getItem('cineworld-favorites');
    const favArray = saved ? JSON.parse(saved) : [];
    
    // Remove duplicates by converting to Set and back
    const uniqueFavs = [...new Set(favArray)];
    
    console.log(`Cleaned: ${favArray.length} → ${uniqueFavs.length} favorites`);
    
    localStorage.setItem('cineworld-favorites', JSON.stringify(uniqueFavs));
    location.reload(); // Reload to apply changes
};

window.clearAllFavorites = function() {
    if (confirm('Are you sure? This will remove ALL favorites.')) {
        localStorage.removeItem('cineworld-favorites');
        localStorage.removeItem('cineworld-collections');
        console.log('Cleared all favorites and collections');
        location.reload();
    }
};