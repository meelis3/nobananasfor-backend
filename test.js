require('dotenv').config();
const { testConnection, getAllShows } = require('./database');

async function runTest() {
  console.log('🚀 Alustame database.js testiga...\n');
  
  // Test ühendust
  const connectionOk = await testConnection();
  
  if (connectionOk) {
    console.log('\n📚 Proovime kõik shows hankida...');
    const result = await getAllShows();
    
    if (result.success) {
      console.log('✅ getAllShows töötab!');
      console.log('📊 Leitud:', result.data.length, 'rida');
      console.log('📋 Esimene rida:', result.data[0] || 'pole andmeid');
    } else {
      console.error('❌ getAllShows viga:', result.error);
    }
  }
  
  console.log('\n🏁 Test lõpetatud!');
}

runTest();
