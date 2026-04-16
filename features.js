// ====== CONFIGURATION ======
const PROXY_BASE_URL = window.PROXY_BASE_URL || window.location.origin;
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// ====== WATCH PROVIDERS ======
// Provider links
const PROVIDER_LINKS = {
    'Netflix': 'https://www.netflix.com',
    'Amazon Prime Video': 'https://www.amazon.com/gp/video/primevideo',
    'Disney+': 'https://www.disneyplus.com',
    'Hulu': 'https://www.hulu.com',
    'HBO Max': 'https://www.hbomax.com',
    'Apple TV': 'https://www.apple.com/tv',
    'Google Play': 'https://play.google.com/store',
    'Vudu': 'https://www.vudu.com',
    'YouTube': 'https://www.youtube.com',
    'Peacock': 'https://www.peacocktv.com',
    'Paramount+': 'https://www.paramountplus.com',
    'Tubi': 'https://tubitv.com'
};

async function fetchWatchProviders(movieId) {
    try {
        console.log('=== WATCH PROVIDERS DEBUG ===');
        console.log('Fetching watch providers for movie:', movieId);
        
        const tmdbPath = `/3/movie/${movieId}/watch/providers`;
        const endpoint = encodeURIComponent(tmdbPath);
        const url = `${PROXY_BASE_URL}/api/movies?endpoint=${endpoint}`;
        console.log('Request URL:', url);
        
        const response = await fetch(url);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            console.error('Response not OK. Status:', response.status);
            return null;
        }
        
        const data = await response.json();
        console.log('Full API response:', JSON.stringify(data, null, 2));
        
        const usProviders = data.results?.US || null;
        console.log('Extracted US Providers:', usProviders);
        console.log('=== END DEBUG ===');
        
        return usProviders;
    } catch (error) {
        console.error("=== ERROR fetching watch providers ===", error);
        console.error('Error stack:', error.stack);
        return null;
    }
}

function displayWatchProviders(providers) {
    console.log('=== DISPLAY WATCH PROVIDERS DEBUG ===');
    console.log('displayWatchProviders called with:', providers);
    
    if (!providers) {
        console.log('No providers available, showing fallback message');
        // Show a message that providers are not available
        let html = '<div id="watch-providers" style="margin: 20px 0; padding: 20px; background: linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(255, 107, 107, 0.05) 100%); border-radius: 12px; border-left: 4px solid #ff6b6b;">';
        html += '<h4 style="color: #ff6b6b; margin: 0 0 10px 0; font-size: 1.1em;">📺 Where to Watch</h4>';
        html += '<p style="margin: 0; color: #999; font-size: 0.95em;">Streaming information not available for this movie yet.</p>';
        html += '</div>';
        console.log('Returning fallback HTML');
        console.log('=== END DEBUG ===');
        return html;
    }
    
    const streamingServices = providers.flatrate || [];
    const rentServices = providers.rent || [];
    const buyServices = providers.buy || [];
    const watchUrl = providers.link || '';
    
    console.log('Streaming services:', streamingServices);
    console.log('Rent services:', rentServices);
    console.log('Buy services:', buyServices);
    console.log('Watch URL:', watchUrl);
    
    let html = '<div id="watch-providers" style="margin: 20px 0; padding: 20px; background: linear-gradient(135deg, rgba(0, 191, 255, 0.15) 0%, rgba(0, 191, 255, 0.05) 100%); border-radius: 12px; border-left: 4px solid var(--accent-blue);">';
    html += '<h4 style="color: var(--accent-blue); margin: 0 0 15px 0; font-size: 1.1em;">📺 Where to Watch</h4>';
    
    let hasAnyProviders = false;
    
    // Streaming Services
    if (streamingServices.length > 0) {
        console.log('Adding streaming services');
        hasAnyProviders = true;
        html += '<div style="margin-bottom: 15px;">';
        html += '<p style="margin: 0 0 8px 0; color: #00d4ff; font-weight: 600; font-size: 0.95em;">🎬 Stream Now:</p>';
        html += '<div style="display: flex; flex-wrap: wrap; gap: 10px;">';
        streamingServices.forEach(service => {
            const link = PROVIDER_LINKS[service.provider_name] || '#';
            html += `<a href="${link}" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 15px; background: rgba(0, 191, 255, 0.2); border: 1px solid rgba(0, 191, 255, 0.4); border-radius: 8px; color: #00d4ff; text-decoration: none; font-weight: 600; transition: all 0.3s ease; cursor: pointer; font-size: 0.95em;" onmouseover="this.style.background='rgba(0, 191, 255, 0.4)'; this.style.boxShadow='0 0 15px rgba(0, 191, 255, 0.3)'" onmouseout="this.style.background='rgba(0, 191, 255, 0.2)'; this.style.boxShadow='none'">${service.provider_name} ↗</a>`;
        });
        html += '</div></div>';
    }
    
    // Rent Services
    if (rentServices.length > 0) {
        console.log('Adding rent services');
        hasAnyProviders = true;
        html += '<div style="margin-bottom: 15px;">';
        html += '<p style="margin: 0 0 8px 0; color: #ffcc00; font-weight: 600; font-size: 0.95em;">🎫 Rent:</p>';
        html += '<div style="display: flex; flex-wrap: wrap; gap: 10px;">';
        rentServices.forEach(service => {
            const link = PROVIDER_LINKS[service.provider_name] || '#';
            html += `<a href="${link}" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 15px; background: rgba(255, 204, 0, 0.15); border: 1px solid rgba(255, 204, 0, 0.4); border-radius: 8px; color: #ffcc00; text-decoration: none; font-weight: 600; transition: all 0.3s ease; cursor: pointer; font-size: 0.95em;" onmouseover="this.style.background='rgba(255, 204, 0, 0.3)'; this.style.boxShadow='0 0 15px rgba(255, 204, 0, 0.3)'" onmouseout="this.style.background='rgba(255, 204, 0, 0.15)'; this.style.boxShadow='none'">${service.provider_name} ↗</a>`;
        });
        html += '</div></div>';
    }
    
    // Buy Services
    if (buyServices.length > 0) {
        console.log('Adding buy services');
        hasAnyProviders = true;
        html += '<div style="margin-bottom: 15px;">';
        html += '<p style="margin: 0 0 8px 0; color: #ff6b6b; font-weight: 600; font-size: 0.95em;">💳 Buy:</p>';
        html += '<div style="display: flex; flex-wrap: wrap; gap: 10px;">';
        buyServices.forEach(service => {
            const link = PROVIDER_LINKS[service.provider_name] || '#';
            html += `<a href="${link}" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 15px; background: rgba(255, 107, 107, 0.15); border: 1px solid rgba(255, 107, 107, 0.4); border-radius: 8px; color: #ff6b6b; text-decoration: none; font-weight: 600; transition: all 0.3s ease; cursor: pointer; font-size: 0.95em;" onmouseover="this.style.background='rgba(255, 107, 107, 0.3)'; this.style.boxShadow='0 0 15px rgba(255, 107, 107, 0.3)'" onmouseout="this.style.background='rgba(255, 107, 107, 0.15)'; this.style.boxShadow='none'">${service.provider_name} ↗</a>`;
        });
        html += '</div></div>';
    }
    
    // More details button
    if (watchUrl) {
        html += `<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(0, 191, 255, 0.2);"><a href="${watchUrl}" target="_blank" rel="noopener" style="display: inline-block; padding: 10px 20px; background: linear-gradient(135deg, rgba(0, 191, 255, 0.3) 0%, rgba(0, 191, 255, 0.1) 100%); border: 2px solid rgba(0, 191, 255, 0.5); border-radius: 8px; color: var(--accent-blue); text-decoration: none; font-weight: 600; transition: all 0.3s ease; cursor: pointer;" onmouseover="this.style.background='linear-gradient(135deg, rgba(0, 191, 255, 0.5) 0%, rgba(0, 191, 255, 0.3) 100%)'; this.style.boxShadow='0 0 20px rgba(0, 191, 255, 0.4)'" onmouseout="this.style.background='linear-gradient(135deg, rgba(0, 191, 255, 0.3) 0%, rgba(0, 191, 255, 0.1) 100%)'; this.style.boxShadow='none'">View More Options ↗</a></div>`;
    }
    
    if (!hasAnyProviders) {
        html += '<p style="margin: 0; color: #999; font-size: 0.95em;">No providers available in your region.</p>';
    }
    
    html += '</div>';
    
    console.log('Generated HTML length:', html.length);
    console.log('HTML preview:', html.substring(0, 200));
    console.log('=== END DEBUG ===');
    
    return html;
}

// ====== PRODUCTION DETAILS ======
function displayProductionDetails(movieData) {
    if (!movieData) return '';
    
    const budget = movieData.budget ? `$${(movieData.budget / 1000000).toFixed(1)}M` : 'N/A';
    const revenue = movieData.revenue ? `$${(movieData.revenue / 1000000).toFixed(1)}M` : 'N/A';
    const language = movieData.original_language?.toUpperCase() || 'N/A';
    const companies = movieData.production_companies?.map(c => c.name).join(', ') || 'N/A';
    const countries = movieData.production_countries?.map(c => c.name).join(', ') || 'N/A';
    
    let html = '<div id="production-details" style="margin: 20px 0; padding: 15px; background: rgba(229, 189, 9, 0.1); border-radius: 10px; border-left: 4px solid var(--accent-gold);">';
    html += '<h4 style="color: var(--accent-gold); margin-top: 0;">🎬 Production Details</h4>';
    html += `<p style="margin: 8px 0;"><strong>Budget:</strong> ${budget}</p>`;
    html += `<p style="margin: 8px 0;"><strong>Revenue:</strong> ${revenue}</p>`;
    html += `<p style="margin: 8px 0;"><strong>Production Companies:</strong> ${companies}</p>`;
    html += `<p style="margin: 8px 0;"><strong>Countries:</strong> ${countries}</p>`;
    html += `<p style="margin: 8px 0;"><strong>Language:</strong> ${language}</p>`;
    html += '</div>';
    return html;
}

// ====== RATINGS DISTRIBUTION CHART ======
function displayRatingsChart(movieData) {
    if (!movieData.vote_average || !movieData.vote_count) return '';
    
    const rating = movieData.vote_average;
    const count = movieData.vote_count;
    const percentage = Math.min((rating / 10) * 100, 100);
    
    let html = '<div id="ratings-chart" style="margin: 20px 0;">';
    html += '<h4 style="color: var(--accent-gold); margin: 0 0 15px 0;">⭐ Ratings</h4>';
    html += `<div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">`;
    html += `<div style="font-size: 2.5em; font-weight: bold; color: var(--accent-gold);">${rating.toFixed(1)}</div>`;
    html += `<div style="flex-grow: 1;">`;
    html += `<div style="background: rgba(0, 0, 0, 0.3); border-radius: 10px; height: 30px; overflow: hidden;">`;
    html += `<div style="background: linear-gradient(90deg, #ffcc00, #e5bd09); height: 100%; width: ${percentage}%; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px;">`;
    html += `<span style="color: #000; font-weight: bold; font-size: 0.85em;">${percentage.toFixed(0)}%</span>`;
    html += `</div></div>`;
    html += `<p style="margin: 8px 0 0 0; color: var(--text-secondary); font-size: 0.85em;">${count.toLocaleString()} votes</p>`;
    html += `</div></div>`;
    html += '</div>';
    return html;
}

// ====== SHARE FUNCTIONALITY ======
function displayShareButtons(movieId, movieTitle) {
    const url = `${window.location.origin}?movie=${movieId}`;
    const encodedUrl = encodeURIComponent(url);
    
    let html = '<div id="share-buttons" style="margin: 20px 0; padding: 15px; background: rgba(0, 191, 255, 0.1); border-radius: 10px;">';
    html += '<h4 style="color: var(--accent-blue); margin-top: 0;">🔗 Share</h4>';
    html += '<div style="display: flex; gap: 10px; flex-wrap: wrap;">';
    
    html += `<button onclick="copyToClipboard('${url}')" style="padding: 8px 15px; background: rgba(0, 191, 255, 0.2); border: 1px solid var(--accent-blue); color: var(--accent-blue); border-radius: 20px; cursor: pointer; font-size: 0.9em; font-weight: 600; transition: all 0.3s;">📋 Copy Link</button>`;
    
    html += `<a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" style="padding: 8px 15px; background: #1877F2; color: white; border-radius: 20px; text-decoration: none; cursor: pointer; font-size: 0.9em; font-weight: 600; transition: all 0.3s;">📱 Facebook</a>`;
    
    html += `<a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${movieTitle} on CineWorld`)}&url=${encodedUrl}" target="_blank" style="padding: 8px 15px; background: #1DA1F2; color: white; border-radius: 20px; text-decoration: none; cursor: pointer; font-size: 0.9em; font-weight: 600; transition: all 0.3s;">🐦 Twitter</a>`;
    
    html += `<a href="https://www.reddit.com/submit?url=${encodedUrl}&title=${encodeURIComponent(movieTitle)}" target="_blank" style="padding: 8px 15px; background: #FF4500; color: white; border-radius: 20px; text-decoration: none; cursor: pointer; font-size: 0.9em; font-weight: 600; transition: all 0.3s;">🔗 Reddit</a>`;
    
    html += '</div></div>';
    return html;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Link copied to clipboard! 🎉');
    }).catch(err => {
        console.error('Could not copy:', err);
    });
}

// COLLECTIONS SYSTEM REMOVED - Use single favorites array instead
// For future enhancements, integrate collections with the main favorites system in movie-fetcher.js

function deleteCollection(name) {
    if (confirm(`Delete "${name}" collection?`)) {
        delete movieCollections[name];
        saveCollections();
        alert('Collection deleted! 🗑️');
    }
}

// ====== COMMENTS/DISCUSSION ======
let movieComments = {};

function loadComments() {
    const saved = localStorage.getItem('cineworld-comments');
    movieComments = saved ? JSON.parse(saved) : {};
}

function saveComments() {
    localStorage.setItem('cineworld-comments', JSON.stringify(movieComments));
}

function addComment(movieId, comment, rating) {
    if (!movieComments[movieId]) {
        movieComments[movieId] = [];
    }
    movieComments[movieId].push({
        text: comment,
        rating: rating,
        author: 'Anonymous',
        date: new Date().toLocaleString(),
        likes: 0
    });
    saveComments();
}

function displayComments(movieId) {
    loadComments();
    const comments = movieComments[movieId] || [];
    
    let html = '<div id="comments-section" style="margin: 20px 0;">';
    html += '<h4 style="color: var(--accent-gold); margin: 0 0 15px 0;">💬 Discussion (Local)</h4>';
    
    html += '<div style="margin-bottom: 15px; padding: 15px; background: rgba(68, 68, 68, 0.3); border-radius: 10px;">';
    html += '<textarea id="comment-input" placeholder="Share your thoughts..." style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid rgba(229, 189, 9, 0.3); background: rgba(30, 30, 30, 0.8); color: white; font-family: inherit; font-size: 0.9em; resize: vertical; min-height: 80px;"></textarea>';
    html += '<div style="margin-top: 10px; display: flex; gap: 10px;">';
    html += '<select id="comment-rating" style="padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(229, 189, 9, 0.3); background: rgba(30, 30, 30, 0.8); color: white;">';
    html += '<option value="">Rate: (optional)</option>';
    for (let i = 1; i <= 10; i++) {
        html += `<option value="${i}">${i}/10 ⭐</option>`;
    }
    html += '</select>';
    html += `<button onclick="submitComment(${movieId})" style="padding: 8px 15px; background: linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-yellow) 100%); color: #1c1c1c; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Post</button>`;
    html += '</div></div>';
    
    html += '<div style="max-height: 300px; overflow-y: auto;">';
    if (comments.length === 0) {
        html += '<p style="color: var(--text-secondary); text-align: center;">No comments yet. Be the first! 🚀</p>';
    } else {
        comments.reverse().forEach(c => {
            html += `<div style="margin: 10px 0; padding: 10px; background: rgba(0, 0, 0, 0.2); border-radius: 8px; border-left: 3px solid var(--accent-blue);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <strong style="color: var(--accent-blue);">${c.author}</strong>
                    <span style="color: var(--text-secondary); font-size: 0.8em;">${c.date}</span>
                </div>
                ${c.rating ? `<p style="margin: 5px 0; color: var(--accent-gold);">👤 Rating: ${c.rating}/10</p>` : ''}
                <p style="margin: 5px 0; color: var(--text-secondary);">${c.text}</p>
                <button onclick="likeComment(this)" style="padding: 4px 8px; background: transparent; border: 1px solid rgba(0, 191, 255, 0.3); color: var(--accent-blue); border-radius: 5px; cursor: pointer; font-size: 0.8em;">👍 Like (${c.likes})</button>
            </div>`;
        });
    }
    html += '</div></div>';
    
    return html;
}

function submitComment(movieId) {
    const commentText = document.getElementById('comment-input').value.trim();
    const rating = document.getElementById('comment-rating').value;
    
    if (!commentText) {
        alert('Please write a comment!');
        return;
    }
    
    addComment(movieId, commentText, rating || null);
    alert('Comment posted! 🎉');
    document.getElementById('comment-input').value = '';
    document.getElementById('comment-rating').value = '';
    
    // Refresh comments display
    const modalDetails = document.querySelector('.modal-details');
    if (modalDetails) {
        const commentsSection = modalDetails.querySelector('#comments-section').parentElement;
        commentsSection.innerHTML = displayComments(movieId);
    }
}

function likeComment(btn) {
    btn.textContent = btn.textContent.replace(/\d+/, m => parseInt(m) + 1);
}

// ====== EXPOSE FUNCTIONS TO WINDOW ======
window.copyToClipboard = copyToClipboard;
window.toggleCollection = toggleCollection;
window.deleteCollection = deleteCollection;
window.openCollectionsManager = openCollectionsManager;
window.submitComment = submitComment;
window.likeComment = likeComment;
window.loadCollections = loadCollections;
window.loadComments = loadComments;
window.fetchWatchProviders = fetchWatchProviders;
window.displayWatchProviders = displayWatchProviders;
window.displayProductionDetails = displayProductionDetails;
window.displayRatingsChart = displayRatingsChart;
window.displayShareButtons = displayShareButtons;
window.displayCollectionsButtons = displayCollectionsButtons;
window.displayComments = displayComments;
