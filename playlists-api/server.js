const express = require('express');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const app = express();
const PORT = 3000;
const os = require('os');
const cors = require("cors");

app.use(express.json());

app.use(cors());

const axios = require('axios');

id = uuidv4();
// Enregistrement de l'API dans Consul vraiment la oulala heu un d dd
axios.put('http://consul:8500/v1/agent/service/register', {
  Name: 'playlists-api',
  Address: getLocalIp(),
  Port: 3000,
  Tags: ['playlists', 'api'],
  id:id,
  Check : {
    http     : "http://"+getLocalIp()+":3000/health",
    interval : "15s",
    timeout :"45s"
  }
})
.then(() => {
  console.log('Service playlists-api enregistré avec succès dans Consul');
})
.catch((error) => {
  console.error('Erreur lors de l\'enregistrement dans Consul:', error.message);
});

// GET : Récupérer une playlist par son id
app.get('/health', (req, res) => {

  res.status(200).json({status:"up"});

});

['SIGINT', 'SIGTERM', 'SIGQUIT']
  .forEach(signal => process.on(signal, async () => {
    console.log(signal);
    await axios.put('http://consul:8500/v1/agent/service/deregister/'+id)
    .then(() => {
      console.log('Service playlists-api supprimé avec succès dans Consul');
    })
    .catch((error) => {
      console.error('Erreur lors de la suppression dans Consul:', error.message);
    });
    process.exit();
  }));

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

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const details of iface) {
      // On vérifie que ce soit une adresse IPv4 et non une adresse interne (localhost)
      if (details.family === "IPv4" && !details.internal) {
        return details.address;
      }
    }
  }
  return "127.0.0.1"; // Par défaut, retourne localhost si aucune IP externe n'est trouvée
}

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});