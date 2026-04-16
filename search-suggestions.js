// ====== SEARCH SUGGESTIONS & AUTOCOMPLETE SYSTEM ======
// YouTube-like search suggestions with enhanced UX - supports both movies and TV series

class SearchSuggestions {
    constructor() {
        this.cache = {};
        this.searchHistory = this.loadSearchHistory();
        this.trendingSearches = ['Avatar', 'Inception', 'The Godfather', 'Interstellar', 'Dark Knight', 'Pulp Fiction', 'Oppenheimer', 'Dune'];
        this.currentQuery = '';
        this.currentMode = 'movie'; // 'movie' or 'tv'
    }

    setMode(mode) {
        console.log(`[SearchSuggestions] ===== MODE CHANGE REQUEST =====`);
        console.log(`[SearchSuggestions] Changing mode from "${this.currentMode}" to "${mode}"`);
        this.currentMode = mode;
        console.log(`[SearchSuggestions] this.currentMode is now:`, this.currentMode);
        this.cache = {}; // Clear cache when switching modes
        console.log(`[SearchSuggestions] Cache cleared for new mode`);
    }

    async fetchSuggestions(query, limit = 8) {
        if (!query || query.length < 1) {
            return [];
        }

        this.currentQuery = query;
        const cacheKey = `suggestions_${this.currentMode}_${query}`;
        if (this.cache[cacheKey]) {
            return this.cache[cacheKey];
        }

        try {
            // Determine if we should fetch movies or TV series
            const endpoint = this.currentMode === 'tv' ? '/3/search/tv' : '/3/search/movie';
            const titleField = this.currentMode === 'tv' ? 'name' : 'title';
            const dateField = this.currentMode === 'tv' ? 'first_air_date' : 'release_date';
            const icon = this.currentMode === 'tv' ? '📺' : '🎬';

            // Use correct endpoint format - the server will add ? between endpoint and params
            const fetchUrl = `${window.PROXY_BASE_URL}/api/movies?endpoint=${endpoint}&query=${encodeURIComponent(query)}&language=en-US&page=1&include_adult=false`;
            console.log(`[SearchSuggestions] Fetching ${this.currentMode} suggestions for "${query}"`, {endpoint, fetchUrl});
            
            const response = await fetch(fetchUrl);
            if (!response.ok) {
                console.error(`[SearchSuggestions] API error: ${response.status} ${response.statusText}`);
                return [];
            }
            
            const data = await response.json();
            console.log(`[SearchSuggestions] API Response for "${query}":`, {
                mode: this.currentMode,
                resultsCount: data.results?.length,
                sampleResult: data.results?.[0]
            });

            const suggestions = (data.results || [])
                .filter(item => {
                    const hasTitle = item[titleField];
                    const hasPoster = item.poster_path;
                    if (!hasTitle) console.log(`[SearchSuggestions] ❌ Filtered - no ${titleField}:`, item.id);
                    if (hasTitle && !hasPoster) console.log(`[SearchSuggestions] ❌ Filtered - "${hasTitle}" has no poster_path`);
                    return hasPoster && hasTitle;
                })
                .slice(0, limit)
                .map(item => ({
                    text: item[titleField],
                    type: this.currentMode,
                    id: item.id,
                    poster: item.poster_path,
                    rating: item.vote_average,
                    overview: item.overview,
                    firstAirDate: item[dateField],
                    year: item[dateField] ? new Date(item[dateField]).getFullYear() : '',
                    icon: icon
                }));

            console.log(`[SearchSuggestions] ✅ Final suggestions for "${query}": ${suggestions.length}`);
            this.cache[cacheKey] = suggestions;
            return suggestions;
        } catch (error) {
            console.error('[SearchSuggestions] Error fetching suggestions:', error);
            return [];
        }
    }

    renderSuggestionsDropdown(suggestions, query = '') {
        if (!suggestions || suggestions.length === 0) {
            console.log(`[SearchSuggestions] No suggestions to render for query: "${query}"`);
            return `
                <div style="padding: 20px; text-align: center; color: #999;">
                    <p style="margin: 0; font-size: 0.9em;">No suggestions found</p>
                </div>
            `;
        }

        console.log(`[SearchSuggestions] Rendering ${suggestions.length} suggestions`);
        return `
            <div style="list-style: none; margin: 0; padding: 0; max-height: 400px; overflow-y: auto;">
                ${suggestions.map((s, idx) => {
                    const boldQuery = query ? query.toLowerCase() : '';
                    let displayText = s.text;
                    let highlightedText = displayText;
                    
                    if (boldQuery && displayText.toLowerCase().includes(boldQuery)) {
                        const startIdx = displayText.toLowerCase().indexOf(boldQuery);
                        highlightedText = `
                            ${displayText.substring(0, startIdx)}<strong style="color: #e5bd09;">${displayText.substring(startIdx, startIdx + boldQuery.length)}</strong>${displayText.substring(startIdx + boldQuery.length)}
                        `;
                    }

                    return `
                        <div class="suggestion-item" data-index="${idx}" style="
                            padding: 12px 20px;
                            cursor: pointer;
                            transition: all 0.15s ease;
                            border-bottom: 1px solid rgba(229, 189, 9, 0.1);
                            display: flex;
                            gap: 15px;
                            align-items: center;
                            color: #fff;
                        " onmouseover="this.style.background='rgba(229, 189, 9, 0.08)'; this.style.borderLeftColor='#e5bd09';" onmouseout="this.style.background='transparent'; this.style.borderLeftColor='transparent';">
                            <span style="font-size: 1.1em; flex-shrink: 0;">${s.icon || '🔍'}</span>
                            ${s.poster ? `<img src="https://image.tmdb.org/t/p/w45${s.poster}" style="width: 28px; height: 42px; object-fit: cover; border-radius: 2px; flex-shrink: 0;">` : ''}
                            <div style="flex: 1; min-width: 0;">
                                <div style="display: block; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500;">${highlightedText}</div>
                                ${s.year ? `<small style="color: #999; font-size: 0.85em;">${s.year}</small>` : ''}
                                ${s.type === 'trending' ? `<small style="color: #e5bd09; font-size: 0.85em;">Trending</small>` : ''}
                            </div>
                            <span style="color: #666; font-size: 1.2em; flex-shrink: 0; opacity: 0; transition: opacity 0.15s ease;" class="suggestion-arrow">⤴</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    addToSearchHistory(query) {
        if (query && query.length > 0) {
            this.searchHistory = this.searchHistory.filter(h => h !== query);
            this.searchHistory.unshift(query);
            this.searchHistory = this.searchHistory.slice(0, 20);
            this.saveSearchHistory();
        }
    }

    getSearchHistory() {
        return this.searchHistory;
    }

    clearSearchHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
    }

    saveSearchHistory() {
        localStorage.setItem('cineworld-search-history', JSON.stringify(this.searchHistory));
    }

    loadSearchHistory() {
        const data = localStorage.getItem('cineworld-search-history');
        return data ? JSON.parse(data) : [];
    }

    async getActorSuggestions(query) {
        if (!query || query.length < 2) return [];

        try {
            const response = await fetch(`${window.PROXY_BASE_URL}/api/movies?endpoint=/3/search/person&query=${encodeURIComponent(query)}&language=en-US&page=1`);
            const data = await response.json();

            return data.results
                .filter(p => p.profile_path)
                .slice(0, 5)
                .map(p => ({
                    text: p.name,
                    type: 'actor',
                    id: p.id,
                    profile: p.profile_path,
                    knownFor: p.known_for_department,
                    icon: '👤'
                }));
        } catch (error) {
            console.error('Error fetching actor suggestions:', error);
            return [];
        }
    }

    setupAutocomplete(inputElement) {
        console.log(`[SearchSuggestions] ===== setupAutocomplete called =====`);
        console.log(`[SearchSuggestions] Input element exists:`, !!inputElement);
        console.log(`[SearchSuggestions] Input element:`, inputElement);
        console.log(`[SearchSuggestions] Input element ID:`, inputElement?.id);
        console.log(`[SearchSuggestions] Input element has parentElement:`, !!inputElement?.parentElement);
        
        if (!inputElement) {
            console.error('[SearchSuggestions] Input element is null/undefined!');
            return;
        }
        if (!inputElement.parentElement) {
            console.error('[SearchSuggestions] Input element has no parent!');
            return;
        }
        
        console.log('[SearchSuggestions] Input element validation passed, proceeding with setup');

        let suggestionsContainer = null;
        let currentIndex = -1;
        let suggestionItems = [];

        const ensureContainer = () => {
            if (suggestionsContainer) return suggestionsContainer;
            console.log(`[SearchSuggestions] Creating suggestions container`);
            suggestionsContainer = document.createElement('div');
            suggestionsContainer.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: rgba(30, 30, 30, 0.98);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(229, 189, 9, 0.3);
                border-top: 2px solid rgba(229, 189, 9, 0.5);
                border-radius: 0 0 12px 12px;
                max-height: 450px;
                overflow-y: auto;
                z-index: 1000;
                display: none;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
                animation: slideDown 0.25s ease-out;
            `;
            inputElement.parentElement.style.position = 'relative';
            inputElement.parentElement.appendChild(suggestionsContainer);
            console.log(`[SearchSuggestions] Container created and appended to DOM`);
            
            // Inject animation keyframes
            if (!document.getElementById('search-suggestion-animation')) {
                const style = document.createElement('style');
                style.id = 'search-suggestion-animation';
                style.textContent = `
                    @keyframes slideDown {
                        from {
                            opacity: 0;
                            transform: translateY(-10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    .suggestion-item.selected {
                        background: rgba(229, 189, 9, 0.15) !important;
                        border-left: 3px solid #e5bd09 !important;
                        padding-left: 17px !important;
                    }
                    .suggestion-item.selected .suggestion-arrow {
                        opacity: 1 !important;
                    }
                    #suggestions-container::-webkit-scrollbar {
                        width: 6px;
                    }
                    #suggestions-container::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    #suggestions-container::-webkit-scrollbar-thumb {
                        background: rgba(229, 189, 9, 0.3);
                        border-radius: 3px;
                    }
                    #suggestions-container::-webkit-scrollbar-thumb:hover {
                        background: rgba(229, 189, 9, 0.5);
                    }
                `;
                document.head.appendChild(style);
            }
            
            suggestionsContainer.id = 'suggestions-container';
            suggestionsContainer.addEventListener('click', (e) => {
                const item = e.target.closest('.suggestion-item');
                if (item) {
                    const text = item.querySelector('div > div:first-child').textContent.trim();
                    inputElement.value = text;
                    suggestionsContainer.style.display = 'none';
                    inputElement.dispatchEvent(new Event('autocomplete-select'));
                    this.addToSearchHistory(text);
                }
            });
            return suggestionsContainer;
        };

        const renderAndShow = async (query) => {
            console.log(`[SearchSuggestions] ===== 🎬 RENDER AND SHOW ===== Query: "${query}"`);
            const container = ensureContainer();
            console.log(`[SearchSuggestions] Getting suggestions...`);
            const suggestions = await this.fetchSuggestions(query);
            console.log(`[SearchSuggestions] Got ${suggestions.length} suggestions`);
            
            const html = this.renderSuggestionsDropdown(suggestions, query);
            console.log(`[SearchSuggestions] HTML generated, length: ${html.length}`);
            
            container.innerHTML = html;
            container.style.display = 'block';
            console.log(`[SearchSuggestions] Container displayed: ${container.style.display}`);
            
            suggestionItems = container.querySelectorAll('.suggestion-item');
            console.log(`[SearchSuggestions] Found ${suggestionItems.length} items in DOM`);
            currentIndex = -1;
        };

        const handleInputChange = async (e) => {
            const query = e.target.value.trim();
            console.log(`[SearchSuggestions] ===== 📝 INPUT CHANGE EVENT ===== `);
            console.log(`[SearchSuggestions] Query: "${query}"`);
            console.log(`[SearchSuggestions] Current mode: ${this.currentMode}`);
            console.log(`[SearchSuggestions] Query length: ${query.length}`);
            const container = ensureContainer();

            if (query.length > 0) {
                console.log(`[SearchSuggestions] ✅ Query not empty, calling renderAndShow...`);
                await renderAndShow(query);
            } else {
                console.log(`[SearchSuggestions] Query empty, hiding suggestions`);
                container.style.display = 'none';
            }
        };

        const handleKeyDown = (e) => {
            const container = suggestionsContainer;
            if (!container || container.style.display === 'none') {
                if (e.key === '/') {
                    e.preventDefault();
                    inputElement.focus();
                }
                return;
            }

            suggestionItems = container.querySelectorAll('.suggestion-item');

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentIndex = Math.min(currentIndex + 1, suggestionItems.length - 1);
                updateSelection();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentIndex = Math.max(currentIndex - 1, -1);
                updateSelection();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentIndex >= 0 && suggestionItems[currentIndex]) {
                    const text = suggestionItems[currentIndex].querySelector('div > div:first-child').textContent.trim();
                    inputElement.value = text;
                    container.style.display = 'none';
                    inputElement.dispatchEvent(new Event('autocomplete-select'));
                    this.addToSearchHistory(text);
                } else {
                    // If no item is selected, search for the current input
                    if (inputElement.value.trim()) {
                        container.style.display = 'none';
                        inputElement.dispatchEvent(new Event('autocomplete-select'));
                        this.addToSearchHistory(inputElement.value.trim());
                    }
                }
            } else if (e.key === 'Escape') {
                container.style.display = 'none';
            }
        };

        const updateSelection = () => {
            suggestionItems.forEach(item => item.classList.remove('selected'));
            if (currentIndex >= 0 && suggestionItems[currentIndex]) {
                suggestionItems[currentIndex].classList.add('selected');
                suggestionItems[currentIndex].scrollIntoView({ block: 'nearest' });
            }
        };

        // Event listeners
        console.log(`[SearchSuggestions] Attaching event listeners to input element`);
        inputElement.addEventListener('input', handleInputChange);
        console.log(`[SearchSuggestions] Attached 'input' listener`);
        inputElement.addEventListener('keydown', handleKeyDown);
        console.log(`[SearchSuggestions] Attached 'keydown' listener`);

        inputElement.addEventListener('focus', async () => {
            console.log(`[SearchSuggestions] Input focused`);
            if (inputElement.value.trim().length === 0) {
                await renderAndShow('');
            } else {
                await renderAndShow(inputElement.value.trim());
            }
        });
        console.log(`[SearchSuggestions] Attached 'focus' listener`);

        inputElement.addEventListener('blur', () => {
            console.log(`[SearchSuggestions] Input blurred, hiding suggestions`);
            setTimeout(() => {
                const container = suggestionsContainer;
                if (container) {
                    container.style.display = 'none';
                }
            }, 250);
        });
        console.log(`[SearchSuggestions] Attached 'blur' listener`);
    }
}
// Initialize search suggestions
console.log('[SearchSuggestions] Creating new SearchSuggestions instance...');
const searchSuggestions = new SearchSuggestions();
window.searchSuggestions = searchSuggestions;
console.log('[SearchSuggestions] ✅ searchSuggestions initialized and set to window');
