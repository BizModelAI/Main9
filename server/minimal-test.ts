import express from "express";

console.log("Starting minimal test server...");

const app = express();
const port = 5000;

app.get("/api/health", (req, res) => {
  res.json({ status: "Test server is running!" });
});

app.get("*", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Test Server</title>
      </head>
      <body>
        <div id="root">
          <h1>Test Server Running</h1>
          <p>Minimal server is working</p>
        </div>
      </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
});
