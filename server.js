const http = require('http');
const fs = require('fs');
const url = require('url'); 
const https = require('https'); 
const TMDB_API_KEY = 'a68f2509a0e4730001df5f5688475f53'; 
const TMDB_BASE_URL = 'api.themoviedb.org';

const index = fs.readFileSync('index.html');
const about = fs.readFileSync('about.html');
const contact = fs.readFileSync('contact.html');
const genre = fs.readFileSync('genre.js');
const movieFetcher = fs.readFileSync('movie-fetcher.js');
const features = fs.readFileSync('features.js');
const watchlist = fs.readFileSync('watchlist.js');
const recommendations = fs.readFileSync('recommendations.js');
const ratings = fs.readFileSync('ratings.js');
const profiles = fs.readFileSync('profiles.js');
const sharing = fs.readFileSync('sharing.js');
const notifications = fs.readFileSync('notifications.js');
const searchSuggestions = fs.readFileSync('search-suggestions.js');
const collections = fs.readFileSync('collections.js');
const tvShows = fs.readFileSync('tv-shows.js');
const pwaSetup = fs.readFileSync('pwa-setup.js');
const uiIntegration = fs.readFileSync('ui-integration.js');
const manifest = fs.readFileSync('manifest.json');
const sw = fs.readFileSync('sw.js'); 

function proxyRequest(tmdbPath, req, res) {
    // Ensure proper separator for API key
    const separator = tmdbPath.includes('?') ? '&' : '?';
    const fullPath = `${tmdbPath}${separator}api_key=${TMDB_API_KEY}`;
    
    console.log('TMDB Request Path:', fullPath);
    
    const options = {
        hostname: TMDB_BASE_URL,  
        path: fullPath, 
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Node.js TMDB Proxy'
        }
    };

    const tmdbReq = https.request(options, (tmdbRes) => {
        let data = '';
        console.log('TMDB Response Status:', tmdbRes.statusCode);
        
        tmdbRes.on('data', (chunk) => {
            data += chunk;
        });
        tmdbRes.on('end', () => {
            try {
                res.writeHead(tmdbRes.statusCode, { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=3600'
                });
                res.end(data);
            } catch (e) {
                console.error('Error writing response:', e);
            }
        });
    });

    tmdbReq.on('error', (e) => {
        console.error(`TMDB Request Error: ${e.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to fetch data from TMDB: ' + e.message }));
    });

    tmdbReq.end();
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // Add modern headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    console.log(req.url);

    if (pathname === '/api/movies') {
        let tmdbEndpoint = parsedUrl.query.endpoint;
        
        // If endpoint contains query params (from double ?), extract just the path
        if (tmdbEndpoint && tmdbEndpoint.includes('?')) {
            tmdbEndpoint = tmdbEndpoint.split('?')[0];
        }
        
        // Build query string from all parameters except 'endpoint'
        const queryParts = [];
        for (const [key, value] of Object.entries(parsedUrl.query)) {
            if (key !== 'endpoint' && value) {
                // Handle both string and array values
                const val = Array.isArray(value) ? value[0] : value;
                queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
            }
        }
        
        const tmdbPath = `${tmdbEndpoint}?${queryParts.join('&')}`;
        console.log('Client Request URL:', req.url);
        console.log('Constructed TMDB Path:', tmdbPath);
        proxyRequest(tmdbPath, req, res);
        return;

    } else if (pathname.startsWith('/api/movie-details/')) {
        const movieId = pathname.split('/').pop();
        const tmdbPath = `/3/movie/${movieId}?language=en-US&append_to_response=credits,videos`;
        proxyRequest(tmdbPath, req, res);
        return;
    } else if (pathname === '/manifest.json') {
        res.writeHead(200, { 'Content-Type': 'application/manifest+json; charset=utf-8' });
        res.end(manifest);
    } else if (pathname === '/sw.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-cache' });
        res.end(sw);
    } else if (pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(index);
    } else if (pathname === '/about.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(about);
    } else if (pathname === '/contact.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(contact);
    } else if (pathname === '/genre.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
        res.end(genre); 
    } else if (pathname === '/movie-fetcher.js') { 
        res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
        res.end(movieFetcher);
    } else if (pathname === '/features.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
        res.end(features);
    } else if (pathname === '/watchlist.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
        res.end(watchlist);
    } else if (pathname === '/recommendations.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
        res.end(recommendations);
    } else if (pathname === '/ratings.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
        res.end(ratings);
    } else if (pathname === '/profiles.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
        res.end(profiles);
    } else if (pathname === '/sharing.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
        res.end(sharing);
    } else if (pathname === '/notifications.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
        res.end(notifications);
    } else if (pathname === '/search-suggestions.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
        res.end(searchSuggestions);
    } else if (pathname === '/collections.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
        res.end(collections);
    } else if (pathname === '/tv-shows.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
        res.end(tvShows);
    } else if (pathname === '/pwa-setup.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
        res.end(pwaSetup);
    } else if (pathname === '/ui-integration.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
        res.end(uiIntegration);
    } else if (pathname.startsWith('/Video/')) {
        try {
            const videoFile = fs.readFileSync(`.${pathname}`);
            res.writeHead(200, { 'Content-Type': 'video/mp4' });
            res.end(videoFile);
        } catch (e) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
    }
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});