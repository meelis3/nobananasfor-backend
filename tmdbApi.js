// tmdbApi.js - TMDB API integratsioon filmide ja seriaalide andmete hankimiseks
const axios = require('axios');

// TMDB konfiguratsioon
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';

// Test TMDB ühendust
async function testTmdbConnection() {
  try {
    console.log('🎬 Testun TMDB API ühendust...');
    
    const response = await axios.get(`${TMDB_BASE_URL}/configuration`, {
      params: { api_key: TMDB_API_KEY }
    });
    
    if (response.status === 200) {
      console.log('✅ TMDB API ühendus töötab!');
      console.log('🖼️ Image base URL:', response.data.images.base_url);
      return true;
    }
    
  } catch (err) {
    console.error('❌ TMDB ühenduse viga:', err.response?.data?.status_message || err.message);
    return false;
  }
}

// Hangi IMDb ID-st TMDB ID
async function getTmdbIdFromImdb(imdbId) {
  try {
    // Eemalda "tt" IMDb ID-st kui olemas
    const cleanImdbId = imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`;
    
    console.log(`🔍 Otsin TMDB ID-d IMDb ID ${cleanImdbId} jaoks...`);
    
    const response = await axios.get(`${TMDB_BASE_URL}/find/${cleanImdbId}`, {
      params: {
        api_key: TMDB_API_KEY,
        external_source: 'imdb_id'
      }
    });
    
    const data = response.data;
    
    // Kontrolli kas leidsime filmi või seriaal
    if (data.movie_results && data.movie_results.length > 0) {
      return {
        success: true,
        type: 'movie',
        tmdb_id: data.movie_results[0].id,
        data: data.movie_results[0]
      };
    }
    
    if (data.tv_results && data.tv_results.length > 0) {
      return {
        success: true,
        type: 'tv',
        tmdb_id: data.tv_results[0].id,
        data: data.tv_results[0]
      };
    }
    
    return { success: false, error: 'Ei leidnud TMDB-st selle IMDb ID jaoks' };
    
  } catch (err) {
    console.error('getTmdbIdFromImdb viga:', err.response?.data?.status_message || err.message);
    return { success: false, error: err.response?.data?.status_message || err.message };
  }
}

// Hangi filmi detailid TMDB ID järgi
async function getMovieDetails(tmdbId) {
  try {
    console.log(`🎬 Hangin filmi detaile TMDB ID ${tmdbId} jaoks...`);
    
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        append_to_response: 'watch/providers'
      }
    });
    
    const movie = response.data;
    
    return {
      success: true,
      data: {
        tmdb_id: movie.id,
        title: movie.title,
        year: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null,
        overview: movie.overview,
        poster_url: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : null,
        backdrop_url: movie.backdrop_path ? `${TMDB_BACKDROP_BASE}${movie.backdrop_path}` : null,
        genres: movie.genres ? movie.genres.map(g => g.name) : [],
        streaming_platforms: movie['watch/providers']?.results?.US?.flatrate || []
      }
    };
    
  } catch (err) {
    console.error('getMovieDetails viga:', err.response?.data?.status_message || err.message);
    return { success: false, error: err.response?.data?.status_message || err.message };
  }
}

// Hangi seriaal detailid TMDB ID järgi
async function getTvDetails(tmdbId) {
  try {
    console.log(`📺 Hangin seriaal detaile TMDB ID ${tmdbId} jaoks...`);
    
    const response = await axios.get(`${TMDB_BASE_URL}/tv/${tmdbId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        append_to_response: 'watch/providers'
      }
    });
    
    const tv = response.data;
    
    return {
      success: true,
      data: {
        tmdb_id: tv.id,
        title: tv.name,
        year: tv.first_air_date ? parseInt(tv.first_air_date.split('-')[0]) : null,
        overview: tv.overview,
        poster_url: tv.poster_path ? `${TMDB_IMAGE_BASE}${tv.poster_path}` : null,
        backdrop_url: tv.backdrop_path ? `${TMDB_BACKDROP_BASE}${tv.backdrop_path}` : null,
        genres: tv.genres ? tv.genres.map(g => g.name) : [],
        streaming_platforms: tv['watch/providers']?.results?.US?.flatrate || []
      }
    };
    
  } catch (err) {
    console.error('getTvDetails viga:', err.response?.data?.status_message || err.message);
    return { success: false, error: err.response?.data?.status_message || err.message };
  }
}

// Hangi kõik andmed IMDb ID järgi (peamine funktsioon)
async function getShowDataFromImdb(imdbId, adminDescription = '') {
  try {
    console.log(`\n🎯 Hangin andmeid IMDb ID ${imdbId} jaoks...`);
    
    // 1. Leia TMDB ID
    const tmdbResult = await getTmdbIdFromImdb(imdbId);
    if (!tmdbResult.success) {
      return tmdbResult;
    }
    
    // 2. Hangi detailid vastavalt tüübile
    let detailsResult;
    if (tmdbResult.type === 'movie') {
      detailsResult = await getMovieDetails(tmdbResult.tmdb_id);
    } else {
      detailsResult = await getTvDetails(tmdbResult.tmdb_id);
    }
    
    if (!detailsResult.success) {
      return detailsResult;
    }
    
    // 3. Kombineeri andmed
    const showData = {
      imdb_id: imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`,
      tmdb_id: detailsResult.data.tmdb_id,
      type: tmdbResult.type,
      title: detailsResult.data.title,
      year: detailsResult.data.year,
      overview: detailsResult.data.overview,
      poster_url: detailsResult.data.poster_url,
      backdrop_url: detailsResult.data.backdrop_url,
      genres: detailsResult.data.genres,
      streaming_platforms: detailsResult.data.streaming_platforms,
      admin_description: adminDescription
    };
    
    console.log('✅ Andmed edukalt hangitud!');
    console.log('📊 Pealkiri:', showData.title);
    console.log('📅 Aasta:', showData.year);
    console.log('🎭 Žanrid:', showData.genres.join(', '));
    
    return { success: true, data: showData };
    
  } catch (err) {
    console.error('getShowDataFromImdb viga:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  testTmdbConnection,
  getTmdbIdFromImdb,
  getMovieDetails,
  getTvDetails,
  getShowDataFromImdb
}
