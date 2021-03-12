require('dotenv').config();
const express = require('express');
const { check, validationResult } = require("express-validator")
const connectDB = require("./data/db")
const cors = require('cors');
const app = express();
const dns = require("dns")

// Model
const Url = require("./models/url")

// Basic Configuration
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB()

app.use(cors());
app.use(express.urlencoded({ extended: false }))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// POST form input from frontend
app.post(
  "/api/shorturl/new", [
    check("url", "invalid url")
      .isURL()
  ], async (req, res) => {

  // Get string input
  const original_url = req.body.url;

  // Check errors
  const errors = validationResult(req)

  if(!errors.isEmpty()) {
    return res.json({ error: "invalid url" })
  }

  // Get url if it already exists in DB
  let url = await Url.findOne({ url: original_url })

  // Get length of objects stored in DB
  let length = await Url.find({})

  // If no documents is saved in DB set variable to zero
  if(length === undefined) length = 0

  // If new url, create new document in DB
  if(!url) {
    url = new Url({
      url: req.body.url,
      shortUrl: length.length + 1
    })

    url.save()
  } else {
    console.log("Url already exists.")
  }

  // Get output in JSON format
  res.json({
    original_url,
    short_url: url.shortUrl
  })
})

// GET redirect to url if short url exists
app.get("/api/shorturl/:short_url", async (req, res) => {

  // Save short_url parameter to a variable
  const param = parseInt(req.params.short_url)

  // Check DB if url exists
  const url = await Url.findOne({ shortUrl: param })

  // If no short url is found in DB, respond with a 404 not found.
  if(!url) {
    return res.status(404).json({ msg: "Didn't find that short_url, try another number" })
  }
  
  // If it exists redirect to url
  res.redirect(url.url)
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
