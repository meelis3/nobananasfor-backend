// database.js - Supabase ühendus ja andmebaasi funktsioonid
const { createClient } = require('@supabase/supabase-js');

// Supabase konfiguratsioon
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Kliendid
const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Test ühendust
async function testConnection() {
  try {
    console.log('🔍 Testun Supabase ühendust...');
    
    // Test lihtne päring
    const { data, error } = await supabase
      .from('shows')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Viga:', error.message);
      return false;
    }
    
    console.log('✅ Supabase ühendus töötab!');
    console.log('📊 Test andmed:', data);
    return true;
    
  } catch (err) {
    console.error('❌ Ühenduse viga:', err.message);
    return false;
  }
}

// Hangi kõik filmid/seriaalid
async function getAllShows() {
  try {
    const { data, error } = await supabase
      .from('shows')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { success: true, data };
    
  } catch (err) {
    console.error('getAllShows viga:', err.message);
    return { success: false, error: err.message };
  }
}

// Lisa uus show (admin)
async function addShow(showData) {
  try {
    const { data, error } = await supabaseAdmin
      .from('shows')
      .insert([showData])
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
    
  } catch (err) {
    console.error('addShow viga:', err.message);
    return { success: false, error: err.message };
  }
}

// Uuenda show
async function updateShow(id, showData) {
  try {
    const { data, error } = await supabaseAdmin
      .from('shows')
      .update(showData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
    
  } catch (err) {
    console.error('updateShow viga:', err.message);
    return { success: false, error: err.message };
  }
}

// Kustuta show
async function deleteShow(id) {
  try {
    const { error } = await supabaseAdmin
      .from('shows')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
    
  } catch (err) {
    console.error('deleteShow viga:', err.message);
    return { success: false, error: err.message };
  }
}

// Otsi IMDb ID järgi
async function findByImdbId(imdbId) {
  try {
    const { data, error } = await supabase
      .from('shows')
      .select('*')
      .eq('imdb_id', imdbId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return { success: true, data: data || null };
    
  } catch (err) {
    console.error('findByImdbId viga:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  supabase,
  supabaseAdmin,
  testConnection,
  getAllShows,
  addShow,
  updateShow,
  deleteShow,
  findByImdbId
};
