if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const SpotifyWebApi = require("spotify-web-api-node");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
app.use(cors());
app.use(bodyParser.json());
const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/hear-me-out";
const User = require("./models/user");
const nodemailer = require("nodemailer");
const lyricsFinder = require("lyrics-finder");

mongoose
  .connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MONGO CONNECTION OPEN!!!");
  })
  .catch((err) => {
    console.log("OH NO MONGO CONNECTION ERROR!!!!");
    console.log(err);
  });

app.get("/", (req, res) => {
  res.send("Application successfully deployed!");
});

const welcomeMessage = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=League+Spartan:wght@700&display=swap');
                body{
                    background-color: aliceblue;
                    font-family: 'League Spartan', sans-serif;
                }
                button{
                    border-radius: 5px;
                    background-color: black;
                    color: white;
                    padding: 15px;
                }
            </style>
        </head>
        <body>
            <div class="container" style="width:500px ;height:500px;">
            <div style="display: block; margin:0 200px;">
                <img style="height: 2rem;" src="https://freepngimg.com/save/26767-welcome-picture/749x217" alt="HearMeOut">
            </div>
            <div>
                <h1 style="text-align: center;">Welcome to HearMeOut, Enthusiast!</h1>
                <p style="text-align: center;">We are delighted to have you here.</p>
            </div>
            <div style=" display: block; margin:0 170px; width: 300px; cursor: pointer;">
        </div>
        <div>
            <p style="text-align: center;">&copy; HearMeOut | 2022</p>
        </div>
        </div>
        </body>
        </html>`;

app.post("/login", async (req, res) => {
  const code = req.body.code;
  console.log(code);
  const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  });

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    // console.log(data);
    res.json({
      accessToken: data.body.access_token,
      refreshToken: data.body.refresh_token,
      expiresIn: data.body.expires_in,
    });
  } catch (e) {
    console.log(e.message);
    res.sendStatus(400);
  }
});

let mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "yelpcamp.alerts@gmail.com",
    pass: process.env.APP_PASSWORD,
  },
});

app.post("/register", async (req, res) => {
  console.log("Hey there!");
  const { email } = req.body;
  console.log(email);
  try {
    const registeredUser = await User.findOne({ email: email });
    if (registeredUser) return;
    const user = await new User({ email: email });
    await user.save();
    let mailDetails = {
      from: "alerts.yelpcamp@gmail.com",
      to: email,
      subject: "Welcome to HearMeOut!",
      html: welcomeMessage,
    };
    if (user.firstAccess) {
      mailTransporter.sendMail(mailDetails, async function (err, data) {
        if (err) {
          console.log("Error Occurs", err);
        } else {
          user.firstAccess = false;
          await user.save();
          console.log("Email sent successfully");
        }
      });
    }
  } catch (e) {
    console.log(e.message);
  }
});

app.post("/refresh", (req, res) => {
  const refreshToken = req.body.refreshToken;
  const spotifyApi = new SpotifyWebApi({
    redirectUri: "http://localhost:3000",
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken,
  });

  spotifyApi
    .refreshAccessToken()
    .then((data) => {
      res.json({
        accessToken: data.body.access_token,
        expiresIn: data.body.expires_in,
      });

      // Save the access token so that it's used in future calls
      //   spotifyApi.setAccessToken(data.body["access_token"]);
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/lyrics", async (req, res) => {
  console.log("lyrics route reached");
  const { title, artist } = req.query;
  console.log("title", title);
  console.log("artist", artist);
  let lyrics = (await lyricsFinder(artist, title)) || "Not Found!";
  // console.log(lyrics);
  res.send({ lyrics });
});

app.listen(5000, () => {
  console.log("App is listening on port 5000");
});
