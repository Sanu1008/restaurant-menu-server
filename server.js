const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

let menuData = [];

// REST endpoint to get current menu
app.get('/menu', (req, res) => {
  res.json(menuData);
});

// Endpoint for Google Apps Script to push updates
app.post('/update-menu', (req, res) => {
  const newData = req.body;
  if (!Array.isArray(newData)) return res.status(400).json({error: 'Invalid data'});
  menuData = newData;

  // Broadcast to all WebSocket clients
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(menuData));
  });

  res.json({status: 'success', updated: menuData.length});
});

const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
  console.log('Client connected');
  ws.send(JSON.stringify(menuData));
  ws.on('close', () => console.log('Client disconnected'));
});
