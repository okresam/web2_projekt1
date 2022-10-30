const express = require("express");
const app = express();
const port = 3000;
const { auth, requiresAuth } = require('express-openid-connect');
const fs = require('fs')
const bodyParser = require('body-parser')

require('dotenv').config();

app.set('veiw engine', 'ejs')

app.use(bodyParser.urlencoded({ extended: false }))

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
  const data = fs.readFileSync('rezultati.txt', 'utf-8').replace("/\r/g", "").split('\n')
  let rezultati = []
  for (let item of data) {
    rezultati.push(item.split(','))
  }
  res.render('index.ejs', { authenticated: req.oidc.isAuthenticated(), user: req.oidc.user, rezultati: rezultati});
});

app.get("/raspored", (req, res) => {
  const data = fs.readFileSync('raspored.txt', 'utf-8').replace("/\r/g", "").split(';\n')
  let raspored = []
  for (let item of data) {
    let kolo = item.split('\n')
    koloParsed = []
    for (let utakmica of kolo) {
      koloParsed.push(utakmica.split(','))
    }
    raspored.push(koloParsed)
  }

  const commentData = fs.readFileSync('komentari.txt', 'utf-8').replace("/\r/g", "").split(';\n')
  let komentari = []
  for (let item of commentData) {
    let koloKomentari = item.split('\n')
    koloKomentariParsed = []
    for (let comment of koloKomentari) {
      koloKomentariParsed.push(comment.split(','))
    }
    komentari.push(koloKomentariParsed)
  }

  res.render('raspored.ejs', { authenticated: req.oidc.isAuthenticated(), user: req.oidc.user, raspored: raspored, komentari: komentari});
});

app.post("/raspored", requiresAuth(), (req, res) => {
  if (req.oidc.user.name != 'admin@mail.com') {
    res.redirect('/raspored')
  }

  const data = fs.readFileSync('raspored.txt', 'utf-8').replace("/\r/g", "").split(';\n')
  let raspored = []
  for (let item of data) {
    let kolo = item.split('\n')
    koloParsed = []
    for (let utakmica of kolo) {
      koloParsed.push(utakmica.split(','))
    }
    raspored.push(koloParsed)
  }

  raspored[req.body.i][req.body.j][2] = req.body.team1
  raspored[req.body.i][req.body.j][3] = req.body.team2

  let outputString = ""
  for (let i = 0; i < raspored.length; i++) {
    for (let j = 0; j < raspored[i].length -1; j++) {
      outputString = outputString + raspored[i][j][0] + "," + raspored[i][j][1] + "," + raspored[i][j][2] + "," + raspored[i][j][3] + "\n"
    }
    if (i != raspored.length - 1) {
      outputString = outputString + ";\n"
    }
  }

  fs.writeFileSync("raspored.txt", outputString)

  res.redirect("/raspored#" + (Number(req.body.i) + 1) + "kolo")
});

app.post("/addcomment", requiresAuth(), (req, res) => {
  const commentData = fs.readFileSync('komentari.txt', 'utf-8').replace("/\r/g", "").split(';\n')
  let komentari = []
  for (let item of commentData) {
    let koloKomentari = item.split('\n')
    koloKomentariParsed = []
    for (let comment of koloKomentari) {
      koloKomentariParsed.push(comment.split(','))
    }
    komentari.push(koloKomentariParsed)
  }

  let currentdate = new Date()
  let newComment = []
  newComment.push(req.oidc.user.name)
  newComment.push(currentdate.getDate() + "/" + (currentdate.getMonth()+1)  + "/" + currentdate.getFullYear() + " "  + currentdate.getHours() + ":"  + currentdate.getMinutes() + ":" + currentdate.getSeconds())
  newComment.push(req.body.komentar)

  komentari[req.body.i].splice(komentari[req.body.i].length - 1, 0, newComment)

  let outputString = ""
  for(let i = 0; i < komentari.length; i++) {
    for (let j = 0; j < komentari[i].length - 1; j++) {
      outputString = outputString + komentari[i][j][0] + "," + komentari[i][j][1] + "," + komentari[i][j][2] + "\n" 
    }
    if (i != komentari.length - 1) {
      outputString = outputString + ";\n"
    }
  }

  fs.writeFileSync("komentari.txt", outputString)

  res.redirect("/raspored#" + (Number(req.body.i) + 1) + "kolo")
});

app.post("/deletecomment", requiresAuth(), (req, res) => {
  if (req.oidc.user.name != 'admin@mail.com' && req.oidc.user.name != req.body.commentuser) {
    res.redirect("/raspored#" + (Number(req.body.i) + 1) + "kolo")
  }

  const commentData = fs.readFileSync('komentari.txt', 'utf-8').replace("/\r/g", "").split(';\n')
  let komentari = []
  for (let item of commentData) {
    let koloKomentari = item.split('\n')
    koloKomentariParsed = []
    for (let comment of koloKomentari) {
      koloKomentariParsed.push(comment.split(','))
    }
    komentari.push(koloKomentariParsed)
  }

  komentari[req.body.i].splice(req.body.j, 1)

  let outputString = ""
  for(let i = 0; i < komentari.length; i++) {
    for (let j = 0; j < komentari[i].length - 1; j++) {
      outputString = outputString + komentari[i][j][0] + "," + komentari[i][j][1] + "," + komentari[i][j][2] + "\n" 
    }
    if (i != komentari.length - 1) {
      outputString = outputString + ";\n"
    }
  }

  fs.writeFileSync("komentari.txt", outputString)

  res.redirect("/raspored#" + (Number(req.body.i) + 1) + "kolo")
});

app.post("/editcomment", requiresAuth(), (req, res) => {
  if (req.oidc.user.name != req.body.commentuser) {
    res.redirect("/raspored#" + (Number(req.body.i) + 1) + "kolo")
  }

  const commentData = fs.readFileSync('komentari.txt', 'utf-8').replace("/\r/g", "").split(';\n')
  let komentari = []
  for (let item of commentData) {
    let koloKomentari = item.split('\n')
    koloKomentariParsed = []
    for (let comment of koloKomentari) {
      koloKomentariParsed.push(comment.split(','))
    }
    komentari.push(koloKomentariParsed)
  }

  komentari[req.body.i][req.body.j][2] = req.body.komentar

  let outputString = ""
  for(let i = 0; i < komentari.length; i++) {
    for (let j = 0; j < komentari[i].length - 1; j++) {
      outputString = outputString + komentari[i][j][0] + "," + komentari[i][j][1] + "," + komentari[i][j][2] + "\n" 
    }
    if (i != komentari.length - 1) {
      outputString = outputString + ";\n"
    }
  }

  fs.writeFileSync("komentari.txt", outputString)

  res.redirect("/raspored#" + (Number(req.body.i) + 1) + "kolo")
});

app.listen(port, () => {
  console.log("Started on port: " + port);
});