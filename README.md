# CineWorld - Quick Start Guide

## 🚀 Starting the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
# Or manually: node server.js
```

### 3. Open in Browser
- Visit: `http://localhost:3000`
- The app should load with all features ready

---

## 📲 Installing as PWA

### On Android:
1. Open Chrome on your phone
2. Visit: `http://localhost:3000` (or your domain)
3. Tap the three-dot menu
4. Select "Install app" or "Add to Home Screen"
5. App will install on your home screen

### On iOS:
1. Open Safari on iPhone/iPad
2. Visit the URL
3. Tap the Share button
4. Select "Add to Home Screen"
5. CineWorld will appear on home screen

### On Desktop:
1. Open any modern browser
2. An "Install App" button will appear on the page
3. Click to install as desktop app

---

## 🎯 Using Each Feature

### Watchlists
- Button: **❤️ Watchlist** in header
- Add movies to different categories
- Mark as watched
- Add personal notes
- Export your lists

### Rate & Review
- Click any movie → Click "⭐ Rate & Review"
- Give 1-10 star rating
- Write a review (optional)
- Mark spoilers if needed

### Collections
- Browse pre-built collections
- Create custom collections
- See all movies in each collection
- Organized by theme/era

### Search
- Start typing → See autocomplete
- Click or press Enter to select
- Search history saved automatically
- Clear history in settings

### Share
- Click watchlist → Share section
- Create shareable link
- Export as JSON/CSV/HTML
- Share on social media

### TV Shows
- Click discovery tabs → Select TV Shows option
- Browse trending, popular, top-rated
- View season & episode details
- Add to watchlist

### Recommendations
- Open movie details
- Scroll to "Similar Movies"
- Click to view details
- Carousel for easy browsing

### Profiles
- Search for actors/directors
- View full filmography
- Read biography
- See top-rated films

---

## ⚙️ Configuration

### Server Port
Edit `server.js` line with `server.listen(3000)`:
```javascript
server.listen(3000, () => { // Change 3000 to desired port
    console.log('Server running on http://localhost:3000');
});
```

### Cache Duration
In each manager file (recommendations.js, tv-shows.js, etc.):
```javascript
this.cacheTTL = 3600000; // 1 hour in milliseconds
// Change to customize cache duration
```

### API Key
Edit `server.js`:
```javascript
const TMDB_API_KEY = 'your-key-here';
```

---

## 🔍 Troubleshooting

### "Script files not found"
- Ensure all `.js` files are in the project root
- Check file names match exactly
- Restart server after adding files

### PWA not installing
- Make sure using HTTPS (in production)
- Clear browser cache
- Try in incognito mode
- Check manifest.json is valid

### Offline not working
- Service Worker takes time to register
- Hard refresh (Ctrl+Shift+R)
- Check browser console for errors
- Cached content needs at least one visit while online

### API errors
- Check internet connection
- Verify TMDB API key is valid
- Check rate limits (TMDB limits requests)
- API might be down

### Watchlist/Ratings not saving
- Check localStorage is enabled
- Browser's storage quota not exceeded
- Check browser console for errors
- Try clearing localStorage and refresh

---

## 📋 Features Summary

| Feature | Location | Shortcut |
|---------|----------|----------|
| Watchlist | Header ❤️ button | Click button |
| Search | Top search bar | Press `/` |
| Trending | Discovery tabs | Click "Trending" |
| Ratings | Movie modal | Click ⭐ |
| Share | Watchlist panel | Click Share button |
| Export | Watchlist panel | Click Export |
| Collections | Main menu | Click Collections |
| TV Shows | Discovery tabs | Click "TV Shows" |
| Theme | Header 🌙 button | Click button |
| About | Header link | Visit /about.html |
| Contact | Header link | Visit /contact.html |

---

## 💾 Backup Your Data

### Export Regularly
```javascript
// In browser console
sharingManager.exportAsJSON(); // Downloads JSON file
sharingManager.exportAsCSV();  // Downloads CSV file
sharingManager.exportAsHTML(); // Downloads HTML report
```

### Restore Data
- Import JSON/CSV files through sharing system
- Or use share links from friends

---

## 🆘 Support & Debugging

### Enable Debug Mode
Open browser console (F12) and run:
```javascript
// View all watches
console.log(watchlistManager.watchlists);

// View all ratings
console.log(ratingsSystem.ratings);

// View search history
console.log(searchSuggestions.searchHistory);

// Check PWA status
console.log(navigator.serviceWorker.controller);

// Check storage usage
navigator.storage.estimate().then(estimate => {
    console.log(`Using ${(estimate.usage/1024/1024).toFixed(2)}MB of ${(estimate.quota/1024/1024).toFixed(2)}MB`);
});
```

---

## 📱 Responsive Design

- **Desktop**: Full feature set
- **Tablet**: Optimized layout
- **Mobile**: Touch-friendly, full features
- **PWA**: Native-like experience

---

## 🔐 Data Privacy

- All data stored locally
- No tracking or analytics
- No data sent to external servers (except TMDB API)
- Can export data anytime
- Can delete all data from settings

---

## 🎓 Learning Resources

- Check FEATURES.md for detailed feature documentation
- Browse source code comments
- Check console for debug info
- Test features in browser console

---

## 🐛 Reporting Issues

If you encounter any issues:
1. Check console for errors (F12)
2. Try clearing cache/cookies
3. Hard refresh (Ctrl+Shift+R)
4. Check browser compatibility
5. Report issues with console logs

---

## ✅ Checklist for First Use

- [ ] npm install
- [ ] npm start
- [ ] Open http://localhost:3000
- [ ] Search for a movie
- [ ] Add to watchlist
- [ ] Rate a movie
- [ ] Enable PWA install
- [ ] Check TV shows tab
- [ ] Try dark/light theme
- [ ] Export your data

---

**Enjoy CineWorld!** 🎬🍿
