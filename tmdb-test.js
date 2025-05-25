require('dotenv').config();
const { testTmdbConnection, getShowDataFromImdb } = require('./tmdbApi');

async function runTmdbTest() {
  console.log('🎬 Alustame TMDB API testiga...\n');
  
  // Test ühendust
  const connectionOk = await testTmdbConnection();
  
  if (connectionOk) {
    console.log('\n🎯 Testime filmi andmete hankimist...');
    
    // Test populaarse filmiga (Inception)
    const result = await getShowDataFromImdb('tt1375666', 'Test kirjeldus filmile');
    
    if (result.success) {
      console.log('\n✅ TMDB andmete hankimine töötab!');
      console.log('📋 Saadud andmed:');
      console.log('  🎬 Pealkiri:', result.data.title);
      console.log('  📅 Aasta:', result.data.year);
      console.log('  🎭 Žanrid:', result.data.genres.join(', '));
      console.log('  🖼️ Poster:', result.data.poster_url ? 'Olemas' : 'Puudub');
    } else {
      console.error('❌ TMDB andmete hankimine ebaõnnestus:', result.error);
    }
  }
  
  console.log('\n🏁 TMDB test lõpetatud!');
}

runTmdbTest();
