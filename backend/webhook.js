const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');

const app = express();
const port = 9000; // can be any free port

app.use(express.json());

app.post('/github-webhook', (req, res) => {
  const payload = req.body;

  // Optional: Add GitHub signature verification here for security

  // Execute the deploy script
  exec('bash ~/Hope-for-paws-official/deploy.sh', (err, stdout, stderr) => {
    if (err) {
      console.error(`Deployment error: ${stderr}`);
      return res.status(500).send('Deployment failed.');
    }
    console.log(`Deployment output: ${stdout}`);
    res.status(200).send('Deployed successfully.');
  });
});

app.listen(port, () => {
  console.log(`Webhook server listening on port ${port}`);
});
