const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

let menuData = [];

// GET /menu
app.get('/menu', (req, res) => {
  res.json({ status: 'success', menu: menuData });
});

// POST /update-menu
app.post('/update-menu', (req, res) => {
  const data = req.body;

  if (!data || !data.type || !data.action) {
    return res.status(400).json({ status: 'error', message: 'Invalid payload' });
  }

  if (data.type === 'menu') {
    if (data.action === 'add') {
      const id = Date.now();
      const newItem = {
        id,
        Name: data.Name,
        Category: data.Category,
        Description: data.Description,
        Variants: data.Variants,
        ImageBase64: data.ImageBase64 || ''
      };
      menuData.push(newItem);
      broadcastMenu();
      return res.json({ status: 'success', id });
    }

    if (data.action === 'update') {
      const index = menuData.findIndex(i => i.id == data.id);
      if (index !== -1) {
        menuData[index] = {
          ...menuData[index],
          Name: data.Name,
          Category: data.Category,
          Description: data.Description,
          Variants: data.Variants,
          ImageBase64: data.ImageBase64 || menuData[index].ImageBase64
        };
        broadcastMenu();
        return res.json({ status: 'success' });
      }
      return res.status(404).json({ status: 'error', message: 'Item not found' });
    }

    if (data.action === 'delete') {
      menuData = menuData.filter(i => i.id != data.id);
      broadcastMenu();
      return res.json({ status: 'success' });
    }
  }

  res.status(400).json({ status: 'error', message: 'Invalid action/type' });
});

// WebSocket setup
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
  console.log('Client connected');
  ws.send(JSON.stringify(menuData));
  ws.on('close', () => console.log('Client disconnected'));
});

// Broadcast updated menu to all clients
function broadcastMenu() {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(menuData));
    }
  });
}
