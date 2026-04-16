// ====== TV SERIES SUPPORT SYSTEM ======
// Browse and search TV shows/series alongside movies

class TVManager {
    constructor() {
        this.cache = {};
        this.cacheTTL = 3600000; // 1 hour
        this.currentPage = 1;
        this.currentType = 'trending'; // tracking current load type
        this.totalPages = 1;
        this.isLoading = false;
        this.hasMorePages = true;
        this.searchQuery = '';
    }

    async searchTVShows(query, page = 1) {
        try {
            this.isLoading = true;
            const fetchUrl = `${window.PROXY_BASE_URL}/api/movies?endpoint=/3/search/tv&query=${encodeURIComponent(query)}&language=en-US&page=${page}`;
            console.log('[TVManager] Searching TV shows with URL:', fetchUrl);
            const response = await fetch(fetchUrl);
            const data = await response.json();
            
            console.log('[TVManager] TV search response:', data);
            
            if (!data.results) {
                console.error('[TVManager] No results field in response! Data structure:', Object.keys(data));
                return { results: [], totalPages: 1, currentPage: page };
            }

            if (page === 1) {
                this.totalPages = data.total_pages || 1;
            }

            return {
                results: data.results
                    .filter(s => s.poster_path)
                    .map(s => ({
                        id: s.id,
                        title: s.name,
                        poster: s.poster_path,
                        rating: s.vote_average,
                        overview: s.overview,
                        firstAirDate: s.first_air_date,
                        type: 'tv',
                        voteCount: s.vote_count,
                        genres: s.genre_ids || []
                    })),
                totalPages: data.total_pages || 1,
                currentPage: page
            };
        } catch (error) {
            console.error('[TVManager] Error searching TV shows:', error);
            return { results: [], totalPages: 1, currentPage: page };
        } finally {
            this.isLoading = false;
        }
    }

    async getTrendingTVShows(page = 1) {
        try {
            this.isLoading = true;
            const response = await fetch(`${window.PROXY_BASE_URL}/api/movies?endpoint=/3/trending/tv/week&language=en-US&page=${page}`);
            const data = await response.json();

            if (page === 1) {
                this.totalPages = data.total_pages || 1;
            }

            return {
                results: data.results
                    .filter(s => s.poster_path)
                    .map(s => ({
                        id: s.id,
                        title: s.name,
                        poster: s.poster_path,
                        rating: s.vote_average,
                        popularity: s.popularity,
                        type: 'tv',
                        genres: s.genre_ids || []
                    })),
                totalPages: data.total_pages || 1,
                currentPage: page
            };
        } catch (error) {
            console.error('Error fetching trending TV:', error);
            return { results: [], totalPages: 1, currentPage: page };
        } finally {
            this.isLoading = false;
        }
    }

    async getPopularTVShows(page = 1) {
        try {
            this.isLoading = true;
            const response = await fetch(`${window.PROXY_BASE_URL}/api/movies?endpoint=/3/tv/popular&language=en-US&page=${page}`);
            const data = await response.json();

            if (page === 1) {
                this.totalPages = data.total_pages || 1;
            }

            return {
                results: data.results
                    .filter(s => s.poster_path)
                    .map(s => ({
                        id: s.id,
                        title: s.name,
                        poster: s.poster_path,
                        rating: s.vote_average,
                        voteCount: s.vote_count,
                        type: 'tv',
                        genres: s.genre_ids || []
                    })),
                totalPages: data.total_pages || 1,
                currentPage: page
            };
        } catch (error) {
            console.error('Error fetching popular TV:', error);
            return { results: [], totalPages: 1, currentPage: page };
        } finally {
            this.isLoading = false;
        }
    }

    async getTopRatedTVShows(page = 1) {
        try {
            this.isLoading = true;
            const response = await fetch(`${window.PROXY_BASE_URL}/api/movies?endpoint=/3/tv/top_rated&language=en-US&page=${page}`);
            const data = await response.json();

            if (page === 1) {
                this.totalPages = data.total_pages || 1;
            }

            return {
                results: data.results
                    .filter(s => s.poster_path && s.vote_count > 300)
                    .map(s => ({
                        id: s.id,
                        title: s.name,
                        poster: s.poster_path,
                        rating: s.vote_average,
                        voteCount: s.vote_count,
                        type: 'tv',
                        genres: s.genre_ids || []
                    })),
                totalPages: data.total_pages || 1,
                currentPage: page
            };
        } catch (error) {
            console.error('Error fetching top-rated TV:', error);
            return { results: [], totalPages: 1, currentPage: page };
        } finally {
            this.isLoading = false;
        }
    }

    async getTVShowDetails(tvId) {
        try {
            const response = await fetch(`${window.PROXY_BASE_URL}/api/movies?endpoint=/3/tv/${tvId}&language=en-US&append_to_response=credits,videos,recommendations`);
            const data = await response.json();

            return {
                id: data.id,
                title: data.name,
                poster: data.poster_path,
                backdrop: data.backdrop_path,
                rating: data.vote_average,
                overview: data.overview,
                genres: data.genres,
                seasons: data.seasons,
                episodes: data.number_of_episodes,
                status: data.status,
                network: data.networks?.[0]?.name,
                firstAirDate: data.first_air_date,
                lastAirDate: data.last_air_date,
                cast: data.credits?.cast || [],
                videos: data.videos?.results || [],
                recommendations: data.recommendations?.results || [],
                type: 'tv'
            };
        } catch (error) {
            console.error('Error fetching TV details:', error);
            return null;
        }
    }

    async getSeasonDetails(tvId, seasonNumber) {
        try {
            const response = await fetch(`${window.PROXY_BASE_URL}/api/movies?endpoint=/3/tv/${tvId}/season/${seasonNumber}&language=en-US`);
            const data = await response.json();

            return {
                seasonNumber: data.season_number,
                episodes: data.episodes.map(ep => ({
                    episodeNumber: ep.episode_number,
                    title: ep.name,
                    overview: ep.overview,
                    rating: ep.vote_average,
                    stillPath: ep.still_path
                }))
            };
        } catch (error) {
            console.error('Error fetching season details:', error);
            return null;
        }
    }

    renderTVShowCard(show) {
        return `
            <div class="tv-card" data-tv-id="${show.id}" style="
                background: rgba(30, 30, 30, 0.7);
                backdrop-filter: blur(10px);
                padding: 15px;
                border-radius: 15px;
                border: 1px solid rgba(0, 191, 255, 0.2);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                flex-direction: column;
                align-items: center;
                cursor: pointer;
                position: relative;
            " onmouseover="this.style.transform='translateY(-8px) scale(1.05)'; this.style.borderColor='var(--accent-blue)'; this.style.boxShadow='0 15px 40px rgba(0, 191, 255, 0.3)'" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.borderColor='rgba(0, 191, 255, 0.2)'; this.style.boxShadow='0 8px 32px rgba(0, 0, 0, 0.4)'">
                <span style="position: absolute; top: 10px; left: 10px; background: rgba(0, 191, 255, 0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.7em; font-weight: 700; z-index: 10;">📺 TV</span>
                <img src="https://image.tmdb.org/t/p/w500${show.poster}" style="width: 100%; height: 280px; object-fit: contain; border-radius: 12px; margin-bottom: 12px;">
                <h2 style="margin: 10px 0 8px; font-size: 1.1em; color: var(--accent-blue); text-align: center; font-weight: 700; line-height: 1.3;">${show.title}</h2>
                <p style="margin: 5px 0; font-size: 0.85em; color: #bbb; text-align: center;">⭐ ${show.rating.toFixed(1)}</p>
                ${show.firstAirDate ? `<p style="margin: 5px 0; font-size: 0.8em; color: #999; text-align: center;">📅 ${new Date(show.firstAirDate).getFullYear()}</p>` : ''}
            </div>
        `;
    }

    renderTVShowModal(show) {
        if (!show) return '';

        const trailer = show.videos?.find(v => v.type === 'Trailer');
        const recommendations = show.recommendations?.slice(0, 6) || [];

        return `
            <div style="background: linear-gradient(135deg, rgba(30, 30, 30, 0.98) 0%, rgba(28, 28, 28, 0.98) 100%); padding: 40px; border-radius: 15px; position: relative;">
                <span class="close" style="position: absolute; top: 15px; right: 25px; cursor: pointer; font-size: 2em; color: #aaa;">&times;</span>
                
                <div style="display: flex; gap: 40px; margin-bottom: 30px;">
                    <div>
                        <img src="https://image.tmdb.org/t/p/w300${show.poster}" style="width: 300px; height: 450px; object-fit: cover; border-radius: 12px; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);">
                    </div>
                    <div style="flex: 1;">
                        <h2 style="color: var(--accent-blue); margin: 0 0 10px 0; font-size: 2em;">${show.title}</h2>
                        
                        <div style="background: rgba(42, 42, 42, 0.6); padding: 15px; border-radius: 10px; border-left: 3px solid var(--accent-blue); margin-bottom: 20px;">
                            <p style="margin: 8px 0;"><strong style="color: var(--accent-gold);">Status:</strong> ${show.status}</p>
                            <p style="margin: 8px 0;"><strong style="color: var(--accent-gold);">Seasons:</strong> ${show.seasons?.length || 'N/A'}</p>
                            <p style="margin: 8px 0;"><strong style="color: var(--accent-gold);">Episodes:</strong> ${show.episodes}</p>
                            <p style="margin: 8px 0;"><strong style="color: var(--accent-gold);">Network:</strong> ${show.network || 'N/A'}</p>
                            <p style="margin: 8px 0;"><strong style="color: var(--accent-gold);">Rating:</strong> ⭐ ${show.rating.toFixed(1)}</p>
                        </div>

                        ${show.overview ? `
                            <div style="margin-top: 15px;">
                                <h4 style="color: var(--accent-blue); margin-bottom: 10px;">📖 Overview</h4>
                                <p style="color: #ccc; line-height: 1.6; font-size: 0.95em;">${show.overview}</p>
                            </div>
                        ` : ''}

                        ${show.genres && show.genres.length > 0 ? `
                            <div style="margin-top: 15px;">
                                <h4 style="color: var(--accent-blue); margin-bottom: 8px;">Genres</h4>
                                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                    ${show.genres.map(g => `<span style="background: rgba(0, 191, 255, 0.2); border: 1px solid rgba(0, 191, 255, 0.4); padding: 4px 12px; border-radius: 15px; font-size: 0.85em; color: var(--accent-blue);">${g.name}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>

                ${trailer ? `
                    <div style="margin: 30px 0; border-radius: 15px; overflow: hidden; box-shadow: 0 8px 30px rgba(0, 191, 255, 0.2);">
                        <iframe width="100%" height="280" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen></iframe>
                    </div>
                ` : ''}

                ${recommendations.length > 0 ? `
                    <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid rgba(0, 191, 255, 0.2);">
                        <h3 style="color: var(--accent-blue); margin-bottom: 15px;">Similar Shows</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 15px;">
                            ${recommendations.map(s => `
                                <div style="text-align: center; cursor: pointer;" data-tv-id="${s.id}">
                                    <img src="https://image.tmdb.org/t/p/w185${s.poster_path}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 8px; border: 2px solid rgba(0, 191, 255, 0.2);">
                                    <p style="font-size: 0.8em; color: #ccc; margin-top: 8px;">${s.name}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    clearCache() {
        this.cache = {};
    }
}

// Initialize TV manager
const tvManager = new TVManager();
window.tvManager = tvManager;

// Function to handle TV show search from the search bar
async function searchTVShows() {
    const query = tvManager.searchQuery;
    if (!query) return;

    const movieGrid = document.querySelector('.movie-grid');
    const spinner = document.querySelector('.spinner');
    if (!movieGrid) return;

    try {
        // Show loading state
        if (spinner) spinner.style.display = 'block';
        movieGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">Searching TV shows...</div>';

        // Search for TV shows
        const results = await tvManager.searchTVShows(query, 1);

        if (spinner) spinner.style.display = 'none';

        if (results.results.length === 0) {
            movieGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">No TV shows found for "' + query + '"</div>';
            return;
        }

        // Display results
        movieGrid.innerHTML = results.results.map(item => tvManager.renderTVShowCard(item)).join('');

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
    } catch (error) {
        console.error('Error searching TV shows:', error);
        if (spinner) spinner.style.display = 'none';
        movieGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">Error searching TV shows. Please try again.</div>';
    }
}

window.searchTVShows = searchTVShows;
