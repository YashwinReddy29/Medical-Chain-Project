require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const data = new FormData();
    data.append("file", req.file.buffer, req.file.originalname);

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      data,
      {
        maxBodyLength: Infinity,
        headers: {
          ...data.getHeaders(),
          pinata_api_key: process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
        },
      }
    );

    res.json({ hash: response.data.IpfsHash });
  } catch (err) {
    console.error(err?.response?.data || err.message);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.get("/download/:hash", async (req, res) => {
  try {
    const file = await axios.get(
      `https://gateway.pinata.cloud/ipfs/${req.params.hash}`,
      { responseType: "arraybuffer" }
    );
    res.send(Buffer.from(file.data));
  } catch (err) {
    res.status(500).json({ error: "Download failed" });
  }
});

app.listen(5000, () => console.log("🏥 Backend running on http://localhost:5000"));
