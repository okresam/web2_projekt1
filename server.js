const express = require("express");
const app = express();
const port = 3000;
const { auth, requiresAuth } = require('express-openid-connect');
const fs = require('fs')

require('dotenv').config();

app.set('veiw engine', 'ejs')

const config = {
  authRequired : false,
  idpLogout : true, //login not only from the app, but also from identity provider
  secret: process.env.SECRET,
  baseURL: `http://localhost:${port}`,
  clientID: process.env.CLIENT_ID,
  issuerBaseURL: 'https://dev-mlhpkl87steqsy2q.eu.auth0.com',
  clientSecret: process.env.CLIENT_SECRET,
  authorizationParams: {
  response_type: 'code'
  ,
  //scope: "openid profile email"
  },
};

app.use(auth(config));

app.get("/", (req, res) => {
  res.redirect('/tablica')
});

app.get("/tablica", (req, res) => {
  const data = fs.readFileSync('rezultati.txt', 'utf-8').replaceAll("\r", "").split('\n')
  let rezultati = []
  for (let item of data) {
    rezultati.push(item.split(','))
  }
  res.render('index.ejs', { authenticated: req.oidc.isAuthenticated(), user: req.oidc.user, rezultati: rezultati});
});

app.get("/raspored", (req, res) => {
  const data = fs.readFileSync('raspored.txt', 'utf-8').replaceAll("\r", "").split(';\n')
  let raspored = []
  for (let item of data) {
    let kolo = item.split('\n')
    koloParsed = []
    for (let utakmica of kolo) {
      koloParsed.push(utakmica.split(','))
    }
    raspored.push(koloParsed)
  }
  res.render('raspored.ejs', { authenticated: req.oidc.isAuthenticated(), user: req.oidc.user, raspored: raspored});
});

app.listen(port, () => {
  console.log("Started on port: " + port);
});