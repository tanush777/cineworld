function initializeGenreFilters() {
  const buttons = document.querySelectorAll('#genre-filters button');
  // Use window.getMovies() exposed from movie-fetcher.js to get the dynamically loaded elements
  // This is crucial for filtering to work on fetched content.
  const movies = window.getMovies ? window.getMovies() : document.querySelectorAll('.movie'); 

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const selectedGenre = button.getAttribute('data-genre');

      movies.forEach(movie => {
        // The data-genre is set to the PRIMARY genre by movie-fetcher.js
        const movieGenre = movie.getAttribute('data-genre'); 

        if (selectedGenre === "all" || movieGenre === selectedGenre) {
          movie.style.display = "flex"; // Changed from 'block' to 'flex' to match CSS
        } else {
          movie.style.display = "none";
        }
      });
    });
  });
}

// Attach the function to the window object so it can be called from movie-fetcher.js
window.initializeGenreFilters = initializeGenreFilters;

// Fallback initialization if movies were not dynamically loaded.
document.addEventListener("DOMContentLoaded", () => {
  if (!window.getMovies) { 
      initializeGenreFilters();
  }
});