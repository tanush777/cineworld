// ====== CURATED COLLECTIONS SYSTEM ======
// Predefined collections like Oscar Winners, MCU, Ghibli Studios, etc.

class CollectionsManager {
    constructor() {
        this.collections = this.initializeCollections();
        this.userCollections = this.loadUserCollections();
    }

    initializeCollections() {
        return {
            'Academy Award Winners': {
                description: 'Best Picture Oscar winners',
                emoji: '🏆',
                color: '#e5bd09',
                genreIds: [18],
                minimumVotes: 1000,
                keywords: ['Oscar', 'award winner']
            },
            'Marvel Cinematic Universe': {
                description: 'All MCU movies in order',
                emoji: '💪',
                color: '#ff0000',
                movies: [], // Would need manual list
                keywords: ['Marvel', 'MCU']
            },
            'Studio Ghibli': {
                description: 'Animations by Studio Ghibli',
                emoji: '🎨',
                color: '#00bfff',
                productionCompanies: [10342],
                keywords: ['Ghibli']
            },
            '90s Classics': {
                description: 'Best movies from the 1990s',
                emoji: '📼',
                color: '#a29bfe',
                yearRange: [1990, 1999],
                minimumVotes: 500
            },
            'Christopher Nolan': {
                description: 'All Christopher Nolan films',
                emoji: '🎬',
                color: '#ffd93d',
                directors: [504],
                keywords: ['Nolan']
            },
            'Sci-Fi Masterpieces': {
                description: 'Best science fiction movies',
                emoji: '🚀',
                color: '#00b894',
                genreIds: [878],
                minimumRating: 7.0,
                minimumVotes: 500
            },
            'Indie Gems': {
                description: 'Outstanding independent films',
                emoji: '💎',
                color: '#74b9ff',
                keywords: ['indie'],
                minimumRating: 7.5
            },
            'Comedy Night': {
                description: 'Funny movies for a laugh',
                emoji: '😂',
                color: '#fdcb6e',
                genreIds: [35],
                minimumVotes: 300
            },
            'Thriller Nights': {
                description: 'Intense thrillers',
                emoji: '😨',
                color: '#e17055',
                genreIds: [53],
                minimumVotes: 300
            },
            'Family Fun': {
                description: 'Movies for all ages',
                emoji: '👨‍👩‍👧‍👦',
                color: '#fdcb6e',
                genreIds: [10751],
                minimumVotes: 300
            }
        };
    }

    async fetchCollectionMovies(collectionName, limit = 8) {
        const collection = this.collections[collectionName];
        if (!collection) return [];

        try {
            let query = '/3/discover/movie?language=en-US&sort_by=popularity.desc&page=1';

            if (collection.genreIds) {
                query += `&with_genres=${collection.genreIds.join(',')}`;
            }
            if (collection.yearRange) {
                query += `&primary_release_date.gte=${collection.yearRange[0]}-01-01&primary_release_date.lte=${collection.yearRange[1]}-12-31`;
            }
            if (collection.minimumRating) {
                query += `&vote_average.gte=${collection.minimumRating}`;
            }
            if (collection.minimumVotes) {
                query += `&vote_count.gte=${collection.minimumVotes}`;
            }

            const response = await fetch(`${window.PROXY_BASE_URL}/api/movies?endpoint=${encodeURIComponent(query)}`);
            const data = await response.json();

            return data.results
                .filter(m => m.poster_path)
                .slice(0, limit)
                .map(m => ({
                    id: m.id,
                    title: m.title,
                    poster: m.poster_path,
                    rating: m.vote_average,
                    year: m.release_date ? new Date(m.release_date).getFullYear() : ''
                }));
        } catch (error) {
            console.error(`Error fetching ${collectionName}:`, error);
            return [];
        }
    }

    createUserCollection(name, description, color = '#00bfff') {
        this.userCollections[name] = {
            description: description,
            color: color,
            movies: [],
            createdAt: new Date().toISOString(),
            isUserCreated: true
        };
        this.saveUserCollections();
    }

    addToUserCollection(collectionName, movieId, movieTitle, moviePoster) {
        if (this.userCollections[collectionName]) {
            if (!this.userCollections[collectionName].movies.find(m => m.id === movieId)) {
                this.userCollections[collectionName].movies.push({
                    id: movieId,
                    title: movieTitle,
                    poster: moviePoster,
                    addedAt: new Date().toISOString()
                });
                this.saveUserCollections();
            }
        }
    }

    removeFromUserCollection(collectionName, movieId) {
        if (this.userCollections[collectionName]) {
            this.userCollections[collectionName].movies = this.userCollections[collectionName].movies.filter(m => m.id !== movieId);
            this.saveUserCollections();
        }
    }

    renderCollectionCard(collectionName, movies) {
        const collection = this.collections[collectionName] || this.userCollections[collectionName];
        
        return `
            <div class="collection-card" data-collection="${collectionName}" style="
                background: linear-gradient(135deg, ${collection.color}30 0%, ${collection.color}10 100%);
                border: 2px solid ${collection.color};
                padding: 20px;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                min-height: 300px;
                display: flex;
                flex-direction: column;
            " onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 8px 20px rgba(0, 191, 255, 0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                <div style="margin-bottom: 15px;">
                    <h2 style="margin: 0 0 8px 0; color: ${collection.color}; font-size: 1.3em;">${collection.emoji} ${collectionName}</h2>
                    <p style="margin: 0; color: #999; font-size: 0.9em;">${collection.description}</p>
                </div>

                ${movies && movies.length > 0 ? `
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; flex: 1;">
                        ${movies.slice(0, 4).map(m => `
                            <img src="https://image.tmdb.org/t/p/w154${m.poster}" 
                                 style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px; border: 1px solid ${collection.color};"
                                 title="${m.title}">
                        `).join('')}
                    </div>
                ` : '<div style="flex: 1; display: flex; align-items: center; justify-content: center; color: #999;">Loading...</div>'}

                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid ${collection.color}50;">
                    <button class="view-collection-btn" data-collection="${collectionName}" style="
                        width: 100%;
                        padding: 8px;
                        background: ${collection.color}20;
                        border: 1px solid ${collection.color};
                        color: ${collection.color};
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='${collection.color}40'" onmouseout="this.style.background='${collection.color}20'">
                        View Collection
                    </button>
                </div>
            </div>
        `;
    }

    renderCollectionsGrid() {
        return `
            <section style="padding: 40px; margin: 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <h1 style="color: var(--accent-blue); margin: 0; font-size: 2em;">🎬 Curated Collections</h1>
                    <button class="back-to-home-btn" style="
                        padding: 10px 20px;
                        background: rgba(0, 191, 255, 0.2);
                        border: 2px solid rgba(0, 191, 255, 0.5);
                        color: var(--accent-blue);
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 1em;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='rgba(0, 191, 255, 0.4)'; this.style.boxShadow='0 0 15px rgba(0, 191, 255, 0.3)'" onmouseout="this.style.background='rgba(0, 191, 255, 0.2)'; this.style.boxShadow='none'">
                        ← Back to Home
                    </button>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
                    ${Object.keys(this.collections).map(collectionName => 
                        this.renderCollectionCard(collectionName, [])
                    ).join('')}
                </div>
            </section>
        `;
    }

    async renderCollectionModal(collectionName) {
        const collection = this.collections[collectionName] || this.userCollections[collectionName];
        const movies = await this.fetchCollectionMovies(collectionName, 20);

        return `
            <div style="background: linear-gradient(135deg, rgba(30, 30, 30, 0.98) 0%, rgba(28, 28, 28, 0.98) 100%); padding: 40px; border-radius: 15px; position: relative; max-width: 1200px; margin: 20px auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div>
                        <h1 style="color: ${collection.color}; margin: 0 0 10px 0; font-size: 2em;">${collection.emoji} ${collectionName}</h1>
                        <p style="color: #999; margin: 0;">${collection.description}</p>
                    </div>
                    <button class="back-to-collections-btn" style="
                        padding: 10px 20px;
                        background: rgba(${collection.color === '#e5bd09' ? '229, 189, 9' : '0, 191, 255'}, 0.2);
                        border: 2px solid ${collection.color};
                        color: ${collection.color};
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 1em;
                        transition: all 0.3s ease;
                        white-space: nowrap;
                    " onmouseover="this.style.background='${collection.color}40'; this.style.boxShadow='0 0 15px ${collection.color}40'" onmouseout="this.style.background='${collection.color}20'; this.style.boxShadow='none'">
                        ← Back
                    </button>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px;">
                    ${movies.map(m => `
                        <div style="text-align: center; cursor: pointer;" data-movie-id="${m.id}">
                            <img src="https://image.tmdb.org/t/p/w200${m.poster}" 
                                 style="width: 100%; height: 225px; object-fit: cover; border-radius: 8px; border: 2px solid ${collection.color}20; transition: all 0.3s ease;"
                                 onmouseover="this.style.borderColor='${collection.color}'; this.style.boxShadow='0 4px 15px ${collection.color}40'"
                                 onmouseout="this.style.borderColor='${collection.color}20'; this.style.boxShadow='none'">
                            <p style="font-size: 0.9em; color: #ccc; margin-top: 8px; font-weight: 600;">${m.title}</p>
                            <p style="color: ${collection.color}; font-size: 0.85em;">⭐ ${m.rating.toFixed(1)}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    saveUserCollections() {
        localStorage.setItem('cineworld-user-collections', JSON.stringify(this.userCollections));
    }

    loadUserCollections() {
        const data = localStorage.getItem('cineworld-user-collections');
        return data ? JSON.parse(data) : {};
    }

    getAllCollections() {
        return { ...this.collections, ...this.userCollections };
    }
}

// Initialize collections manager
const collectionsManager = new CollectionsManager();
window.collectionsManager = collectionsManager;
