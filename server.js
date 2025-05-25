// server.js - Express API server nobananasfor.me projektile
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Meie moodulid
const { 
  testConnection, 
  getAllShows, 
  addShow, 
  updateShow, 
  deleteShow, 
  findByImdbId 
} = require('./database');

const { 
  testTmdbConnection, 
  getShowDataFromImdb 
} = require('./tmdbApi');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Test endpoint
app.get('/api/test', async (req, res) => {
  try {
    console.log('🔍 Test endpoint kutsutud...');
    
    const dbTest = await testConnection();
    const tmdbTest = await testTmdbConnection();
    
    res.json({
      success: true,
      message: 'API server töötab!',
      timestamp: new Date().toISOString(),
      tests: {
        database: dbTest ? 'OK' : 'FAIL',
        tmdb: tmdbTest ? 'OK' : 'FAIL'
      }
    });
  } catch (error) {
    console.error('Test endpoint viga:', error);
    res.status(500).json({
      success: false,
      error: 'Server viga'
    });
  }
});

// Hangi kõik filmid/seriaalid (WordPress jaoks)
app.get('/api/shows', async (req, res) => {
  try {
    console.log('📚 Hangin kõik shows...');
    
    const result = await getAllShows();
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        count: result.data.length
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('GET /api/shows viga:', error);
    res.status(500).json({
      success: false,
      error: 'Server viga'
    });
  }
});

// Hangi üks show ID järgi
app.get('/api/shows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Hangin show ID ${id}...`);
    
    const result = await getAllShows();
    
    if (result.success) {
      const show = result.data.find(s => s.id == id);
      if (show) {
        res.json({
          success: true,
          data: show
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Show ei leitud'
        });
      }
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`GET /api/shows/${req.params.id} viga:`, error);
    res.status(500).json({
      success: false,
      error: 'Server viga'
    });
  }
});

// Lisa uus show IMDb ID-ga (admin)
app.post('/api/admin/shows', async (req, res) => {
  try {
    const { imdb_id, admin_description } = req.body;
    
    if (!imdb_id) {
      return res.status(400).json({
        success: false,
        error: 'imdb_id on kohustuslik'
      });
    }
    
    console.log(`➕ Lisan uut show IMDb ID ${imdb_id}...`);
    
    // Kontrolli kas juba olemas
    const existing = await findByImdbId(imdb_id);
    if (existing.success && existing.data) {
      return res.status(409).json({
        success: false,
        error: 'See IMDb ID on juba olemas',
        existing_show: existing.data
      });
    }
    
    // Hangi TMDB andmed
    const tmdbResult = await getShowDataFromImdb(imdb_id, admin_description || '');
    
    if (!tmdbResult.success) {
      return res.status(400).json({
        success: false,
        error: `TMDB andmete hankimine ebaõnnestus: ${tmdbResult.error}`
      });
    }
    
    // Lisa andmebaasi
    const addResult = await addShow(tmdbResult.data);
    
    if (addResult.success) {
      console.log('✅ Show edukalt lisatud!');
      res.status(201).json({
        success: true,
        message: 'Show edukalt lisatud',
        data: addResult.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: `Andmebaasi lisamine ebaõnnestus: ${addResult.error}`
      });
    }
    
  } catch (error) {
    console.error('POST /api/admin/shows viga:', error);
    res.status(500).json({
      success: false,
      error: 'Server viga'
    });
  }
});

// Uuenda show (admin)
app.put('/api/admin/shows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`✏️ Uuendan show ID ${id}...`);
    
    const result = await updateShow(id, updateData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Show edukalt uuendatud',
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`PUT /api/admin/shows/${req.params.id} viga:`, error);
    res.status(500).json({
      success: false,
      error: 'Server viga'
    });
  }
});

// Kustuta show (admin)
app.delete('/api/admin/shows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Kustutan show ID ${id}...`);
    
    const result = await deleteShow(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Show edukalt kustutatud'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`DELETE /api/admin/shows/${req.params.id} viga:`, error);
    res.status(500).json({
      success: false,
      error: 'Server viga'
    });
  }
});

// Refresh show andmed TMDB-st (admin)
app.post('/api/admin/shows/:id/refresh', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔄 Refreshin show ID ${id} andmeid...`);
    
    // Leia show
    const showsResult = await getAllShows();
    if (!showsResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Ei suutnud show-sid hankida'
      });
    }
    
    const show = showsResult.data.find(s => s.id == id);
    if (!show) {
      return res.status(404).json({
        success: false,
        error: 'Show ei leitud'
      });
    }
    
    if (!show.imdb_id) {
      return res.status(400).json({
        success: false,
        error: 'Show-l puudub IMDb ID'
      });
    }
    
    // Hangi uued TMDB andmed
    const tmdbResult = await getShowDataFromImdb(show.imdb_id, show.admin_description);
    
    if (!tmdbResult.success) {
      return res.status(400).json({
        success: false,
        error: `TMDB andmete hankimine ebaõnnestus: ${tmdbResult.error}`
      });
    }
    
    // Uuenda andmebaasis (säilita admin_description)
    const updateData = {
      ...tmdbResult.data,
      admin_description: show.admin_description
    };
    
    const updateResult = await updateShow(id, updateData);
    
    if (updateResult.success) {
      res.json({
        success: true,
        message: 'Show andmed edukalt uuendatud TMDB-st',
        data: updateResult.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: updateResult.error
      });
    }
    
  } catch (error) {
    console.error(`POST /api/admin/shows/${req.params.id}/refresh viga:`, error);
    res.status(500).json({
      success: false,
      error: 'Server viga'
    });
  }
});

// Admin panel (lihtne HTML)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// 404 handler - PARANDATUD
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint ei leitud',
    available_endpoints: [
      'GET /api/test',
      'GET /api/shows',
      'GET /api/shows/:id',
      'POST /api/admin/shows',
      'PUT /api/admin/shows/:id',
      'DELETE /api/admin/shows/:id',
      'POST /api/admin/shows/:id/refresh',
      'GET /admin'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Sisemine server viga'
  });
});

// Käivita server
app.listen(PORT, () => {
  console.log(`\n🚀 nobananasfor.me API server käivitatud!`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
  console.log(`👨‍💼 Admin: http://localhost:${PORT}/admin`);
  console.log(`📚 Shows: http://localhost:${PORT}/api/shows`);
  console.log(`\n✅ Valmis teenindama päringuid!\n`);
});
