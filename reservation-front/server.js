const express = require('express');
const path = require('path');

const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());

const axios = require('axios');

// Enregistrement de l'API dans Consul
axios.put('http://consul:8500/v1/agent/service/register', {
  Name: 'reservation-front',
  Address: 'reservation-front',
  Port: 3000,
  Tags: ['reservation', 'front']
})
.then(() => {
  console.log('Service reservation-front enregistré avec succès dans Consul');
})
.catch((error) => {
  console.error('Erreur lors de l\'enregistrement dans Consul:', error.message);
});

// Servir le fichier index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});