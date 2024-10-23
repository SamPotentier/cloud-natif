const express = require('express');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const app = express();
const PORT = 3000;
const cors = require("cors");

app.use(express.json());

app.use(cors());

const FILE_PATH = './playlists.json';

const readFile = () => {
  try {
    const data = fs.readFileSync(FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const writeFile = (data) => {
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
};

// GET : Récupérer toutes les playlists
app.get('/playlists', (req, res) => {
  const playlists = readFile();
  res.json(playlists);
});

// GET : Récupérer une playlist par son id
app.get('/playlists/:id', (req, res) => {
  const playlists = readFile();
  const playlist = playlists.find(p => p.id === req.params.id);
  
  if (playlist) {
    res.json(playlist);
  } else {
    res.status(404).json({ message: 'Playlist non trouvée' });
  }
});

// POST : Créer une nouvelle playlist
app.post('/playlists', (req, res) => {
  const playlists = readFile();
  const newPlaylist = {
    id: uuidv4(), // Génère un ID unique
    nom: req.body.nom,
    description: req.body.description,
    musiques: req.body.musiques // Liste d'objets {auteur, nom}
  };

  playlists.push(newPlaylist);
  writeFile(playlists);

  res.status(201).json(newPlaylist);
});

// PUT : Mettre à jour une playlist par son id
app.put('/playlists/:id', (req, res) => {
  const playlists = readFile();
  const playlistIndex = playlists.findIndex(p => p.id === req.params.id);

  if (playlistIndex !== -1) {
    const updatedPlaylist = {
      id: playlists[playlistIndex].id, // ID reste inchangé
      nom: req.body.nom || playlists[playlistIndex].nom,
      description: req.body.description || playlists[playlistIndex].description,
      musiques: req.body.musiques || playlists[playlistIndex].musiques
    };

    playlists[playlistIndex] = updatedPlaylist;
    writeFile(playlists);

    res.json(updatedPlaylist);
  } else {
    res.status(404).json({ message: 'Playlist non trouvée' });
  }
});

// DELETE : Supprimer une playlist par son id
app.delete('/playlists/:id', (req, res) => {
  const playlists = readFile();
  const updatedPlaylists = playlists.filter(p => p.id !== req.params.id);

  if (updatedPlaylists.length < playlists.length) {
    writeFile(updatedPlaylists);
    res.json({ message: 'Playlist supprimée avec succès' });
  } else {
    res.status(404).json({ message: 'Playlist non trouvée' });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
