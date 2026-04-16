// ====== MOVIE RECOMMENDATIONS ENGINE ======
// Provides similar movies, trending recommendations, and personalized suggestions

class RecommendationsEngine {
    constructor() {
        this.recommendations = {};
        this.cache = {};
        this.cacheTTL = 3600000; // 1 hour
    }

    async getSimilarMovies(movieId, limit = 6) {
        const cacheKey = `similar_${movieId}`;
        
        if (this.cache[cacheKey] && Date.now() - this.cache[cacheKey].time < this.cacheTTL) {
            return this.cache[cacheKey].data;
        }

        try {
            const response = await fetch(`${window.PROXY_BASE_URL}/api/movies?endpoint=/3/movie/${movieId}/similar&language=en-US&page=1`);
            const data = await response.json();
            
            const similar = data.results
                .filter(m => m.poster_path)
                .slice(0, limit)
                .map(m => ({
                    id: m.id,
                    title: m.title,
                    poster: m.poster_path,
                    rating: m.vote_average,
                    year: m.release_date ? new Date(m.release_date).getFullYear() : ''
                }));

            this.cache[cacheKey] = { data: similar, time: Date.now() };
            return similar;
        } catch (error) {
            console.error('Error fetching similar movies:', error);
            return [];
        }
    }

    async getTrendingMovies(limit = 8) {
        const cacheKey = 'trending_movies';
        
        if (this.cache[cacheKey] && Date.now() - this.cache[cacheKey].time < this.cacheTTL) {
            return this.cache[cacheKey].data;
        }

        try {
            const response = await fetch(`${window.PROXY_BASE_URL}/api/movies?endpoint=/3/trending/movie/week&language=en-US`);
            const data = await response.json();
            
            const trending = data.results
                .filter(m => m.poster_path)
                .slice(0, limit)
                .map(m => ({
                    id: m.id,
                    title: m.title,
                    poster: m.poster_path,
                    rating: m.vote_average,
                    popularity: m.popularity
                }));

            this.cache[cacheKey] = { data: trending, time: Date.now() };
            return trending;
        } catch (error) {
            console.error('Error fetching trending:', error);
            return [];
        }
    }

    async getUpcomingMovies(limit = 8) {
        const cacheKey = 'upcoming_movies';
        
        if (this.cache[cacheKey] && Date.now() - this.cache[cacheKey].time < this.cacheTTL) {
            return this.cache[cacheKey].data;
        }

        try {
            const response = await fetch(`${window.PROXY_BASE_URL}/api/movies?endpoint=/3/movie/upcoming&language=en-US&sort_by=release_date.asc`);
            const data = await response.json();
            
            const upcoming = data.results
                .filter(m => m.poster_path)
                .slice(0, limit)
                .map(m => ({
                    id: m.id,
                    title: m.title,
                    poster: m.poster_path,
                    releaseDate: m.release_date,
                    rating: m.vote_average
                }));

            this.cache[cacheKey] = { data: upcoming, time: Date.now() };
            return upcoming;
        } catch (error) {
            console.error('Error fetching upcoming:', error);
            return [];
        }
    }

    async getTopRatedMovies(year = null, limit = 8) {
        const cacheKey = `top_rated_${year || 'all'}`;
        
        if (this.cache[cacheKey] && Date.now() - this.cache[cacheKey].time < this.cacheTTL) {
            return this.cache[cacheKey].data;
        }

        try {
            let query = `/3/movie/top_rated?language=en-US&region=US&page=1`;
            const response = await fetch(`${window.PROXY_BASE_URL}/api/movies?endpoint=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            const topRated = data.results
                .filter(m => m.poster_path && m.vote_count > 500)
                .slice(0, limit)
                .map(m => ({
                    id: m.id,
                    title: m.title,
                    poster: m.poster_path,
                    rating: m.vote_average,
                    voteCount: m.vote_count
                }));

            this.cache[cacheKey] = { data: topRated, time: Date.now() };
            return topRated;
        } catch (error) {
            console.error('Error fetching top rated:', error);
            return [];
        }
    }

    async getByGenre(genreId, limit = 8) {
        const cacheKey = `genre_${genreId}`;
        
        if (this.cache[cacheKey] && Date.now() - this.cache[cacheKey].time < this.cacheTTL) {
            return this.cache[cacheKey].data;
        }

        try {
            const response = await fetch(`${window.PROXY_BASE_URL}/api/movies?endpoint=/3/discover/movie?with_genres=${genreId}&sort_by=popularity.desc&page=1`);
            const data = await response.json();
            
            const movies = data.results
                .filter(m => m.poster_path)
                .slice(0, limit)
                .map(m => ({
                    id: m.id,
                    title: m.title,
                    poster: m.poster_path,
                    rating: m.vote_average,
                    year: m.release_date ? new Date(m.release_date).getFullYear() : ''
                }));

            this.cache[cacheKey] = { data: movies, time: Date.now() };
            return movies;
        } catch (error) {
            console.error('Error fetching by genre:', error);
            return [];
        }
    }

    renderRecommendationsSection(title, recommendations, sectionId) {
        const html = `
            <section id="${sectionId}" style="margin: 40px; padding: 30px; background: rgba(42, 42, 42, 0.6); border-radius: 15px; border: 1px solid rgba(0, 191, 255, 0.2);">
                <h2 style="color: var(--accent-blue); margin-bottom: 20px; font-size: 1.5em;">🎬 ${title}</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 15px;">
                    ${recommendations.map(m => `
                        <div style="cursor: pointer; text-align: center; transition: all 0.3s ease;" data-movie-id="${m.id}">
                            <img src="https://image.tmdb.org/t/p/w200${m.poster}" 
                                 style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; border: 2px solid rgba(0, 191, 255, 0.3); transition: all 0.3s ease;"
                                 onmouseover="this.style.borderColor='var(--accent-blue)'; this.style.boxShadow='0 4px 15px rgba(0, 191, 255, 0.3)'"
                                 onmouseout="this.style.borderColor='rgba(0, 191, 255, 0.3)'; this.style.boxShadow='none'">
                            <p style="margin-top: 8px; color: #ccc; font-size: 0.9em; font-weight: 600;">${m.title}</p>
                            ${m.rating ? `<p style="color: var(--accent-gold); font-size: 0.85em;">⭐ ${m.rating.toFixed(1)}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
        
        return html;
    }

    renderRecommendationsCarousel(recommendations, containerId) {
        const carousel = `
            <div style="overflow-x: auto; display: flex; gap: 15px; padding: 15px; scroll-behavior: smooth;">
                ${recommendations.map(m => `
                    <div style="flex-shrink: 0; text-align: center; cursor: pointer;" data-movie-id="${m.id}">
                        <img src="https://image.tmdb.org/t/p/w150${m.poster}" 
                             style="width: 100px; height: 150px; object-fit: cover; border-radius: 8px; border: 2px solid rgba(0, 191, 255, 0.2); transition: all 0.3s ease;"
                             onmouseover="this.style.transform='scale(1.05)'; this.style.borderColor='var(--accent-blue)'"
                             onmouseout="this.style.transform='scale(1)'; this.style.borderColor='rgba(0, 191, 255, 0.2)'">
                        <p style="margin-top: 8px; color: #bbb; font-size: 0.8em; max-width: 100px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.title}</p>
                    </div>
                `).join('')}
            </div>
        `;
        
        return carousel;
    }

    clearCache() {
        this.cache = {};
    }
}

// Initialize recommendations engine
const recommendationsEngine = new RecommendationsEngine();
window.recommendationsEngine = recommendationsEngine;
