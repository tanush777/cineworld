// ====== ACTOR & DIRECTOR PROFILES SYSTEM ======
// Browse actor/director details, filmography, and biography

class ProfileManager {
    constructor() {
        this.cache = {};
        this.cacheTTL = 86400000; // 24 hours
    }

    async getActorProfile(personId) {
        const cacheKey = `actor_${personId}`;
        
        if (this.cache[cacheKey] && Date.now() - this.cache[cacheKey].time < this.cacheTTL) {
            return this.cache[cacheKey].data;
        }

        try {
            const response = await fetch(`${window.PROXY_BASE_URL}/api/movies?endpoint=/3/person/${personId}?language=en-US&append_to_response=movie_credits`);
            const data = await response.json();

            const profile = {
                id: data.id,
                name: data.name,
                biography: data.biography,
                birthday: data.birthday,
                deathday: data.deathday,
                placeOfBirth: data.place_of_birth,
                profileImg: data.profile_path,
                popularity: data.popularity,
                knownFor: data.known_for_department,
                jobTitle: data.job_title || 'Actor',
                filmography: data.movie_credits?.cast || []
            };

            this.cache[cacheKey] = { data: profile, time: Date.now() };
            return profile;
        } catch (error) {
            console.error('Error fetching actor profile:', error);
            return null;
        }
    }

    async getDirectorProfile(personId) {
        const profile = await this.getActorProfile(personId);
        if (profile) {
            profile.filmography = profile.filmography.filter(f => f.vote_count > 100);
        }
        return profile;
    }

    async searchActor(actorName) {
        try {
            const response = await fetch(`${window.PROXY_BASE_URL}/api/movies?endpoint=/3/search/person?query=${encodeURIComponent(actorName)}&language=en-US&page=1`);
            const data = await response.json();
            
            return data.results.filter(p => p.profile_path).map(p => ({
                id: p.id,
                name: p.name,
                profileImg: p.profile_path,
                knownFor: p.known_for_department,
                popularity: p.popularity
            }));
        } catch (error) {
            console.error('Error searching actors:', error);
            return [];
        }
    }

    renderProfileModal(profile) {
        if (!profile) return '';

        const age = profile.birthday ? (new Date().getFullYear() - new Date(profile.birthday).getFullYear()) : 'N/A';
        const filmCount = profile.filmography.length;
        const topFilms = profile.filmography
            .filter(f => f.poster_path)
            .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
            .slice(0, 6);

        return `
            <div style="background: linear-gradient(135deg, rgba(30, 30, 30, 0.98) 0%, rgba(28, 28, 28, 0.98) 100%); padding: 40px; border-radius: 15px; position: relative;">
                <span class="close" style="position: absolute; top: 15px; right: 25px; cursor: pointer; font-size: 2em; color: #aaa;">&times;</span>
                
                <div style="display: flex; gap: 40px; margin-bottom: 30px;">
                    <div>
                        ${profile.profileImg ? `<img src="https://image.tmdb.org/t/p/w300${profile.profileImg}" style="width: 250px; height: 350px; object-fit: cover; border-radius: 12px; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);">` : '<div style="width: 250px; height: 350px; background: rgba(100, 100, 100, 0.3); border-radius: 12px;"></div>'}
                    </div>
                    <div style="flex: 1;">
                        <h2 style="color: var(--accent-yellow); margin-bottom: 10px; font-size: 2em;">${profile.name}</h2>
                        
                        <div style="background: rgba(42, 42, 42, 0.6); padding: 15px; border-radius: 10px; border-left: 3px solid var(--accent-blue); margin-bottom: 20px;">
                            <p style="margin: 8px 0;"><strong style="color: var(--accent-gold);">Known For:</strong> ${profile.knownFor}</p>
                            <p style="margin: 8px 0;"><strong style="color: var(--accent-gold);">Age:</strong> ${age}</p>
                            ${profile.birthday ? `<p style="margin: 8px 0;"><strong style="color: var(--accent-gold);">Birthday:</strong> ${new Date(profile.birthday).toLocaleDateString()}</p>` : ''}
                            ${profile.placeOfBirth ? `<p style="margin: 8px 0;"><strong style="color: var(--accent-gold);">Born:</strong> ${profile.placeOfBirth}</p>` : ''}
                            ${profile.deathday ? `<p style="margin: 8px 0;"><strong style="color: var(--accent-gold);">Died:</strong> ${new Date(profile.deathday).toLocaleDateString()}</p>` : ''}
                            <p style="margin: 8px 0;"><strong style="color: var(--accent-gold);">Films:</strong> ${filmCount}</p>
                        </div>

                        ${profile.biography ? `
                            <div style="margin-top: 15px;">
                                <h4 style="color: var(--accent-blue); margin-bottom: 10px;">📖 Biography</h4>
                                <p style="color: #ccc; line-height: 1.6; font-size: 0.95em; max-height: 200px; overflow-y: auto;">${profile.biography}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>

                ${topFilms.length > 0 ? `
                    <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid rgba(0, 191, 255, 0.2);">
                        <h3 style="color: var(--accent-blue); margin-bottom: 15px;">🎬 Top Films</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 15px;">
                            ${topFilms.map(film => `
                                <div style="text-align: center; cursor: pointer;" data-movie-id="${film.id}">
                                    <img src="https://image.tmdb.org/t/p/w185${film.poster_path}" 
                                         style="width: 100%; height: 180px; object-fit: cover; border-radius: 8px; border: 2px solid rgba(0, 191, 255, 0.2); transition: all 0.3s ease;"
                                         onmouseover="this.style.borderColor='var(--accent-blue)'; this.style.boxShadow='0 4px 15px rgba(0, 191, 255, 0.3)'"
                                         onmouseout="this.style.borderColor='rgba(0, 191, 255, 0.2)'; this.style.boxShadow='none'">
                                    <p style="font-size: 0.85em; color: #ccc; margin-top: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${film.title}</p>
                                    ${film.vote_average ? `<p style="color: var(--accent-gold); font-size: 0.8em;">⭐ ${film.vote_average.toFixed(1)}</p>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderActorCard(profile) {
        return `
            <div class="actor-card" data-actor-id="${profile.id}" style="background: rgba(42, 42, 42, 0.6); padding: 15px; border-radius: 10px; border: 1px solid rgba(0, 191, 255, 0.2); transition: all 0.3s ease; cursor: pointer; text-align: center;">
                ${profile.profileImg ? `<img src="https://image.tmdb.org/t/p/w185${profile.profileImg}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;">` : '<div style="width: 100%; height: 200px; background: rgba(100, 100, 100, 0.3); border-radius: 8px; margin-bottom: 10px;"></div>'}
                <h4 style="color: var(--accent-yellow); margin: 10px 0 5px;">${profile.name}</h4>
                <p style="color: #999; font-size: 0.85em; margin: 5px 0;">${profile.knownFor}</p>
                <small style="color: #666;">Popularity: ${profile.popularity.toFixed(0)}</small>
            </div>
        `;
    }

    clearCache() {
        this.cache = {};
    }
}

// Initialize profile manager
const profileManager = new ProfileManager();
window.profileManager = profileManager;
