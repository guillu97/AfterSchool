const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require('path')
const favicon = require('serve-favicon')

const { authJwt } = require("./app/middleware");

const app = express();

const session = require('express-session');

const useragent = require('express-useragent');

const db = require("./app/models");
const Role = db.role;

const dbConfig = require("./app/config/db.config");

const passAuthConfig = require("./app/config/auth.config")


app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: passAuthConfig.secret // TODO: change in production
}));

app.use(useragent.express());

app.use(favicon(path.join(__dirname, 'public', 'favicon.svg')))

var corsOptions = {
  origin: "http://localhost:8081"
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));





db.mongoose
  .connect(`mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Successfully connect to MongoDB.");
    initial();
  })
  .catch(err => {
    console.error("Connection error", err);
    process.exit();
  });


// set the view engine to ejs
app.set('view engine', 'ejs');

// index page
app.get('/', function(req, res) {

  const [connected, response, userId] = authJwt.verifyTokenReturn(req, res)

  // console.log(connected,response, userId)

  if(connected){

    // TODO: get user to send it to the view

    res.render('pages/main', {
      userId: userId,
    });
  }
  else{
    res.render('pages/index', {});
  }
});





app.get('/signin', function(req, res) {
  // console.log("mobile:",req.useragent.isMobile)

  const [connected, userId] = authJwt.verifyTokenReturn(req, res)

  if(connected){

    // TODO: get user to send it to the view

    res.render('pages/main', {
      userId: userId,
    });
  }
  else{
    res.render('pages/signin', {mobile:req.useragent.isMobile});
  }
});

app.get('/register', function(req, res) {

  const [connected, userId] = authJwt.verifyTokenReturn(req, res)

  if(connected){

    // TODO: get user to send it to the view

    res.render('pages/main', {
      userId: userId,
    });
  }
  else{
    res.render('pages/register', {mobile:req.useragent.isMobile});
  }
});

// about page
app.get('/about', function(req, res) {
  res.render('pages/about');
});


// for static files
app.use('/static', express.static('public'));

// simple route
// app.get("/", (req, res) => {
//   res.json({ message: "Welcome to bezkoder application." });
// });

// app.get('/google', function(req, res) {
//   res.render('pages/auth');
// });

// routes
require('./app/routes/auth.routes')(app);
require('./app/routes/user.routes')(app);

require('./googleAuth/')(app);

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});




function initial() {
  Role.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      new Role({
        name: "user"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'user' to roles collection");
      });

      new Role({
        name: "moderator"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'moderator' to roles collection");
      });

      new Role({
        name: "admin"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'admin' to roles collection");
      });
    }
  });
}