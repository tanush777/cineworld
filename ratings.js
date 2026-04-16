// ====== USER RATINGS & REVIEWS SYSTEM ======
// Allow users to rate movies and write personal reviews/notes

class RatingsSystem {
    constructor() {
        this.ratings = this.loadRatings();
        this.reviews = this.loadReviews();
    }

    addRating(movieId, movieTitle, rating) {
        if (rating < 0 || rating > 10) return false;
        
        this.ratings[movieId] = {
            movieId: movieId,
            movieTitle: movieTitle,
            rating: rating,
            timestamp: new Date().toISOString()
        };
        this.saveRatings();
        return true;
    }

    addReview(movieId, movieTitle, reviewText, spoilers = false) {
        if (!this.reviews[movieId]) {
            this.reviews[movieId] = [];
        }

        this.reviews[movieId].push({
            id: Date.now(),
            text: reviewText,
            spoilers: spoilers,
            likes: 0,
            timestamp: new Date().toISOString()
        });
        this.saveReviews();
    }

    getReviewsForMovie(movieId) {
        return this.reviews[movieId] || [];
    }

    getRatingForMovie(movieId) {
        return this.ratings[movieId] || null;
    }

    getAllRatings() {
        return this.ratings;
    }

    deleteReview(movieId, reviewId) {
        if (this.reviews[movieId]) {
            this.reviews[movieId] = this.reviews[movieId].filter(r => r.id !== reviewId);
            this.saveReviews();
        }
    }

    averageRating() {
        const ratings = Object.values(this.ratings);
        if (ratings.length === 0) return 0;
        const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
        return (sum / ratings.length).toFixed(1);
    }

    getTopRatedMovies(limit = 10) {
        return Object.values(this.ratings)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, limit);
    }

    saveRatings() {
        localStorage.setItem('cineworld-ratings', JSON.stringify(this.ratings));
    }

    loadRatings() {
        const data = localStorage.getItem('cineworld-ratings');
        return data ? JSON.parse(data) : {};
    }

    saveReviews() {
        localStorage.setItem('cineworld-reviews', JSON.stringify(this.reviews));
    }

    loadReviews() {
        const data = localStorage.getItem('cineworld-reviews');
        return data ? JSON.parse(data) : {};
    }

    renderRatingModal(movieId, movieTitle) {
        return `
            <div id="rating-modal-${movieId}" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: linear-gradient(135deg, rgba(30, 30, 30, 0.98) 0%, rgba(28, 28, 28, 0.98) 100%); padding: 30px; border-radius: 15px; border: 1px solid rgba(0, 191, 255, 0.3); box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6); z-index: 2000; width: 90%; max-width: 500px;">
                <h3 style="color: var(--accent-yellow); margin-bottom: 20px;">⭐ Rate & Review</h3>
                
                <label style="display: block; margin-bottom: 15px; color: var(--accent-blue);">
                    <strong>Your Rating:</strong>
                    <div id="star-rating-${movieId}" style="display: flex; gap: 5px; margin-top: 10px;">
                        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => `
                            <span class="star-btn" data-rating="${i}" style="cursor: pointer; font-size: 1.8em; color: #444; transition: all 0.2s ease;" title="${i}/10">★</span>
                        `).join('')}
                    </div>
                </label>

                <label style="display: block; margin-bottom: 15px;">
                    <strong style="color: var(--accent-blue);">Write a Review (optional):</strong>
                    <textarea id="review-text-${movieId}" placeholder="Share your thoughts about this movie..." style="width: 100%; height: 120px; padding: 10px; border-radius: 8px; border: 1px solid rgba(0, 191, 255, 0.3); background: rgba(30, 30, 30, 0.8); color: white; font-family: inherit; margin-top: 8px; resize: none;"></textarea>
                </label>

                <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px; color: #999;">
                    <input type="checkbox" id="spoiler-warning-${movieId}" style="cursor: pointer;">
                    <span>Contains spoilers</span>
                </label>

                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="cancel-review-btn" data-movie-id="${movieId}" style="padding: 10px 20px; background: rgba(100, 100, 100, 0.4); border: 1px solid #666; color: #ccc; border-radius: 8px; cursor: pointer;">Cancel</button>
                    <button class="submit-review-btn" data-movie-id="${movieId}" style="padding: 10px 20px; background: linear-gradient(135deg, var(--accent-blue) 0%, #0099cc 100%); border: none; color: white; border-radius: 8px; cursor: pointer; font-weight: 600;">Submit</button>
                </div>
            </div>
        `;
    }

    renderReviewsSection(movieId, reviews) {
        if (reviews.length === 0) {
            return '<div style="text-align: center; color: #999; padding: 20px;">No reviews yet. Be the first to review!</div>';
        }

        return `
            <div style="margin-top: 20px;">
                <h4 style="color: var(--accent-blue); margin-bottom: 15px;">📝 Reviews</h4>
                ${reviews.map(review => `
                    <div style="background: rgba(42, 42, 42, 0.6); padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid var(--accent-blue);">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div style="flex: 1;">
                                ${review.spoilers ? '<span style="background: #ff6b6b; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75em; font-weight: 600;">⚠️ SPOILERS</span>' : ''}
                                <p style="color: #ccc; margin: 10px 0; line-height: 1.5;">${review.text}</p>
                                <small style="color: #999;">📅 ${new Date(review.timestamp).toLocaleDateString()}</small>
                            </div>
                            <button class="delete-review-btn" data-movie-id="${movieId}" data-review-id="${review.id}" style="background: rgba(255, 0, 0, 0.2); border: none; color: #ff6b6b; cursor: pointer; padding: 4px 8px; border-radius: 4px;">×</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    exportRatings(format = 'json') {
        if (format === 'json') {
            return JSON.stringify({
                ratings: this.ratings,
                reviews: this.reviews,
                averageRating: this.averageRating(),
                exportDate: new Date().toISOString()
            }, null, 2);
        } else if (format === 'csv') {
            let csv = 'Movie Title,Rating,Timestamp\n';
            Object.values(this.ratings).forEach(r => {
                csv += `"${r.movieTitle}",${r.rating},${r.timestamp}\n`;
            });
            return csv;
        }
    }
}

// Initialize ratings system
const ratingsSystem = new RatingsSystem();
window.ratingsSystem = ratingsSystem;
