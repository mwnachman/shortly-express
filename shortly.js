var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');


var session = require('express-session');
var cookieParser = require('cookie-parser');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');



var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(cookieParser());//would add credentials file here
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
//express session
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
}));

app.get('/',  
function(req, res) {
  //if logged in redirect to create
  /*if () {

  } else {*/
  //else redirect to login
    res.redirect('/login');
  //
});

app.get('/create', 
function(req, res) {
  //res.render('login');

  //todo: if not logged in
  res.redirect('/login');
});

app.get('/links', 
function(req, res) {
  //if not logged in
  res.redirect('/login');
  //else if logged in
  Links.reset().fetch().then(function(links) {
    res.status(200).send(links.models);
  });
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.get('/login', function(request, response) {
  response.render('login');
});

app.post('/login', function(request, response) {
  console.log('req body', request.body);
  var username = request.body.username;
  var password = request.body.password;
  //user object from db?
  var pword = db.knex('users').where({
    username: username
  }).select('password');
  console.log('pw from db', pword);
  if (password === pword/*something in db'*/) {
    request.session.regenerate(function() {
      //should set cookie
      request.session.user = username;//name from user object
      response.redirect('/create');
    });
  } else {
    response.redirect('/create');
  }
});

app.get('/signup', function(request, response) {
  response.render('signup');
});

/*app.post('/signup', function(request, response) {
  var querystring = '';
  //db.knex.schema.....
  //("id" integer not null primary key autoincrement, "username" varchar(255), 
  //"password" varchar(255), "salt" varchar(255), "hash" varchar(255));
  //db.knex('users').insert({id: null, username: 'md', password: 'md', salt: 'md', hash: 'md'}).then;
  new User({})
});*/

app.post('/signup', 
function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  new User({
    id: null, 
    username: username, 
    password: password, 
    salt: 'md', 
    hash: 'md' })
  .fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
      console.log('Youre a user!!!');
    } else {
      //create.then
      Users.create({
        id: null, 
        username: username,
        password: password,
        salt: 'md',
        hash: 'md'
      })
      .then(function(newUser) {
        res.status(200).cookie('monster', 'nom nom').redirect('/login');

      });
    }
  });
});


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
