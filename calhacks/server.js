// Simple Express server for Google Cloud Storage access
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Load credentials from environment variable or file
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
let storage;
if (keyPath && fs.existsSync(keyPath)) {
  storage = new Storage({ keyFilename: keyPath });
} else if (process.env.GCS_KEY_JSON) {
  storage = new Storage({ credentials: JSON.parse(process.env.GCS_KEY_JSON) });
} else if (process.env.GCS) {
  storage = new Storage({ credentials: JSON.parse(process.env.GCS) });
} else {
  throw new Error('Google Cloud credentials not found.');
}

// Example endpoint: list files in a bucket
app.get('/api/gcs/list', async (req, res) => {
  const bucketName = req.query.bucket;
  if (!bucketName) return res.status(400).json({ error: 'Missing bucket param' });
  try {
    const [files] = await storage.bucket(bucketName).getFiles();
    res.json(files.map(f => f.name));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Example endpoint: get a file's public URL
app.get('/api/gcs/url', (req, res) => {
  const bucketName = req.query.bucket;
  const fileName = req.query.file;
  if (!bucketName || !fileName) return res.status(400).json({ error: 'Missing params' });
  const url = `https://storage.googleapis.com/${bucketName}/${fileName}`;
  res.json({ url });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`GCS proxy server running on port ${PORT}`);
});
