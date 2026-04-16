// ====== DATA SHARING & EXPORT SYSTEM ======
// Export watchlists, ratings, and create shareable links

class SharingManager {
    constructor() {
        this.shareLinks = this.loadShareLinks();
    }

    exportAsJSON() {
        const data = {
            watchlists: window.watchlistManager.watchlists,
            ratings: window.ratingsSystem.getAllRatings(),
            reviews: window.ratingsSystem.reviews,
            exportDate: new Date().toISOString(),
            appVersion: '2.0'
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        this.downloadFile(dataStr, 'CineWorld-Export.json', 'application/json');
    }

    exportAsCSV() {
        let csv = 'Movie,Watchlist,Watched,Rating,Added Date\n';
        
        Object.entries(window.watchlistManager.watchlists).forEach(([category, list]) => {
            list.movies.forEach(movie => {
                csv += `"${movie.title}","${category}",${movie.watched ? 'Yes' : 'No'},${movie.rating},"${movie.addedDate}"\n`;
            });
        });
        
        this.downloadFile(csv, 'CineWorld-Watchlist.csv', 'text/csv');
    }

    exportAsHTML() {
        const data = {
            watchlists: window.watchlistManager.watchlists,
            ratings: window.ratingsSystem.getAllRatings()
        };

        let html = `
<!DOCTYPE html>
<html>
<head>
    <title>CineWorld - Exported Data</title>
    <style>
        body { font-family: Arial, sans-serif; background: #0f0f0f; color: #fff; margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #ffcc00; text-align: center; }
        h2 { color: #00bfff; margin-top: 30px; border-bottom: 2px solid #00bfff; padding-bottom: 10px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-box { background: #1e1e1e; padding: 20px; border-radius: 8px; text-align: center; border-left: 3px solid #ffcc00; }
        .stat-box strong { color: #ffcc00; font-size: 1.5em; display: block; margin-bottom: 5px; }
        .watchlist { background: #1e1e1e; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #00bfff; }
        .movie-item { background: #2a2a2a; padding: 10px; margin: 8px 0; border-radius: 5px; }
        .movie-item strong { color: #ffcc00; }
        .rating { color: #e5bd09; }
        .export-time { text-align: center; color: #999; margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎬 CineWorld Export</h1>
        
        <div class="stats">
            <div class="stat-box">
                <strong>${Object.values(data.watchlists).reduce((sum, list) => sum + list.movies.length, 0)}</strong>
                Total Movies
            </div>
            <div class="stat-box">
                <strong>${Object.keys(data.watchlists).length}</strong>
                Watchlists
            </div>
            <div class="stat-box">
                <strong>${Object.keys(data.ratings).length}</strong>
                Rated Movies
            </div>
            <div class="stat-box">
                <strong>${window.ratingsSystem.averageRating()}</strong>
                Average Rating
            </div>
        </div>

        ${Object.entries(data.watchlists).map(([category, list]) => `
            <div class="watchlist">
                <h2>${category} (${list.movies.length})</h2>
                ${list.movies.map(movie => `
                    <div class="movie-item">
                        <strong>${movie.title}</strong>
                        ${movie.watched ? ' ✓ Watched' : ' ⏳ Unwatched'}
                        ${movie.rating ? `<span class="rating"> • ⭐ ${movie.rating}/10</span>` : ''}
                        ${movie.notes ? `<div style="color: #999; font-size: 0.9em; margin-top: 5px; font-style: italic;">${movie.notes}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        `).join('')}

        <div class="export-time">
            Exported: ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>
        `;

        this.downloadFile(html, 'CineWorld-Report.html', 'text/html');
    }

    createShareableLink() {
        const data = {
            watchlists: window.watchlistManager.watchlists,
            ratings: window.ratingsSystem.getAllRatings(),
            timestamp: Date.now()
        };

        const encoded = btoa(JSON.stringify(data));
        const shareLink = `${window.location.origin}/?import=${encoded}`;
        
        const shareData = {
            id: Date.now().toString(),
            link: shareLink,
            createdAt: new Date().toISOString(),
            moviesCount: Object.values(data.watchlists).reduce((sum, list) => sum + list.movies.length, 0)
        };

        this.shareLinks.push(shareData);
        this.saveShareLinks();
        
        return shareLink;
    }

    importSharedData(encodedData) {
        try {
            const data = JSON.parse(atob(encodedData));
            
            // Import watchlists
            Object.entries(data.watchlists).forEach(([category, list]) => {
                if (!window.watchlistManager.watchlists[category]) {
                    window.watchlistManager.watchlists[category] = list;
                }
            });
            window.watchlistManager.saveToStorage();

            // Import ratings
            Object.entries(data.ratings).forEach(([movieId, rating]) => {
                window.ratingsSystem.ratings[movieId] = rating;
            });
            window.ratingsSystem.saveRatings();

            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    generateShareModal() {
        const shareLink = this.createShareableLink();
        
        return `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: linear-gradient(135deg, rgba(30, 30, 30, 0.98) 0%, rgba(28, 28, 28, 0.98) 100%); padding: 30px; border-radius: 15px; border: 1px solid rgba(0, 191, 255, 0.3); box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6); z-index: 2000; width: 90%; max-width: 500px;">
                <h3 style="color: var(--accent-yellow); margin-bottom: 20px; margin-top: 0;">🔗 Share Your Watchlists</h3>
                
                <div style="background: rgba(42, 42, 42, 0.6); padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid rgba(0, 191, 255, 0.2);">
                    <p style="color: #999; font-size: 0.9em; margin: 0 0 10px 0;">Share Link (send to friends):</p>
                    <input type="text" value="${shareLink}" readonly style="width: 100%; padding: 10px; background: rgba(30, 30, 30, 0.8); color: #00bfff; border: 1px solid rgba(0, 191, 255, 0.3); border-radius: 5px; font-family: monospace; font-size: 0.8em; word-break: break-all;">
                </div>

                <div style="display: flex; gap: 10px;">
                    <button onclick="navigator.clipboard.writeText('${shareLink}'); this.textContent='Copied!'; setTimeout(() => this.textContent='Copy Link', 2000);" style="flex: 1; padding: 10px; background: linear-gradient(135deg, var(--accent-blue) 0%, #0099cc 100%); border: none; color: white; border-radius: 6px; cursor: pointer; font-weight: 600;">Copy Link</button>
                    <button onclick="window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent('Check out my movie watchlists!'), '_blank');" style="flex: 1; padding: 10px; background: rgba(0, 172, 238, 0.2); border: 1px solid rgba(0, 172, 238, 0.5); color: #00acee; border-radius: 6px; cursor: pointer; font-weight: 600;">Tweet</button>
                </div>

                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(0, 191, 255, 0.2);">
                    <h4 style="color: var(--accent-blue); margin: 0 0 10px 0;">Export Options:</h4>
                    <button class="export-btn" data-format="json" style="display: block; width: 100%; padding: 8px; margin-bottom: 8px; background: rgba(0, 191, 255, 0.1); border: 1px solid rgba(0, 191, 255, 0.3); color: var(--accent-blue); border-radius: 5px; cursor: pointer;">📥 Download as JSON</button>
                    <button class="export-btn" data-format="csv" style="display: block; width: 100%; padding: 8px; margin-bottom: 8px; background: rgba(0, 191, 255, 0.1); border: 1px solid rgba(0, 191, 255, 0.3); color: var(--accent-blue); border-radius: 5px; cursor: pointer;">📥 Download as CSV</button>
                    <button class="export-btn" data-format="html" style="display: block; width: 100%; padding: 8px; background: rgba(0, 191, 255, 0.1); border: 1px solid rgba(0, 191, 255, 0.3); color: var(--accent-blue); border-radius: 5px; cursor: pointer;">📥 Download as HTML Report</button>
                </div>

                <button class="close-share-modal" style="position: absolute; top: 15px; right: 15px; background: none; border: none; color: #aaa; font-size: 1.5em; cursor: pointer;">&times;</button>
            </div>
        `;
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    saveShareLinks() {
        localStorage.setItem('cineworld-share-links', JSON.stringify(this.shareLinks));
    }

    loadShareLinks() {
        const data = localStorage.getItem('cineworld-share-links');
        return data ? JSON.parse(data) : [];
    }
}

// Initialize sharing manager
const sharingManager = new SharingManager();
window.sharingManager = sharingManager;
