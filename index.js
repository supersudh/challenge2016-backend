const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const morgan = require('morgan');
var jsonfile = require('jsonfile')
const app = express();
// const router = require('./router');
const cors = require('cors');
var dataBase;
// App Setup
app.use(morgan('combined'));
app.use(cors());
app.use(bodyParser.json({ type: '*/*' }));
var fs = require('fs');

var userDetails = [];
// router(app);

// Server Setup
if (fs.existsSync(__dirname + '/database.json')) {
  jsonfile.readFile(__dirname + '/database.json', function (err, data) {
    dataBase = data;
    const port = process.env.PORT || 8080;
    const server = http.createServer(app);
    server.listen(port);
    console.log('Server listening on:', port);
  })
}
else {
  require('./csvOp')().then(data => {
    dataBase = data;
    const port = process.env.PORT || 8080;
    const server = http.createServer(app);
    server.listen(port);
    console.log('Server listening on:', port);
  }, err => {
    console.log("Err index", err);
  });
}

var GLOBAL_USER_POOL = [];

app.get('/countries', (req, res) => {
  res.send(dataBase.countries);
});

app.get('/states', (req, res) => {
  res.send(dataBase.states.filter(state => state.country_code == req.query.country_code));
});

app.get('/cities', (req, res) => {
  res.send(dataBase.cities.filter(city => ((city.country_code == req.query.country_code) && (city.province_code == req.query.province_code))));
});

app.post('/create_distributor', (req, res) => {
  let { name, is_child, is_child_of } = req.body;
  if (!(GLOBAL_USER_POOL.some(t => t.name == name))) {
    let id = GLOBAL_USER_POOL.length + 1;
    GLOBAL_USER_POOL.push({ name, id, permissions: [], banned: [], is_child, is_child_of });
    res.send(GLOBAL_USER_POOL);
  }
  else {
    res.send({ Error: "Distributor Name already Taken." }).status(400);
  }
});

app.post('/add_permission', (req, res) => {
  let { country_code, province_code, city_code, id } = req.body;
  for (let i in GLOBAL_USER_POOL) {
    if (GLOBAL_USER_POOL[i].id == id) {
      GLOBAL_USER_POOL[i].permissions.push({ country_code, province_code, city_code });
      break;
    }
  }
  res.send(GLOBAL_USER_POOL);
});

app.post('/block_permission', (req, res) => {
  let { country_code, province_code, city_code, id } = req.body;
  for (let i in GLOBAL_USER_POOL) {
    if (GLOBAL_USER_POOL[i].id == id) {
      GLOBAL_USER_POOL[i].banned.push({ country_code, province_code, city_code });
      break;
    }
  }
  res.send(GLOBAL_USER_POOL);
});

app.post('check_permissions', (req, res) => {
  let { country_code, province_code, city_code, id } = req.body;
  let data;
  for (let i in GLOBAL_USER_POOL) {
    if (GLOBAL_USER_POOL[i].id == id) {
      let user = GLOBAL_USER_POOL[i];
      if (user.banned.some(t => (t.country_code == country_code || t.province_code == province_code || t.city_code == city_code))) {
        res.send({ data: "NO" }).status(200);
      }
      if (!user.is_child) {
        res.send({ data: "YES" }).status(200);
      }
      else {
        if (user.permissions.every(t => (t.country_code == country_code || t.province_code == province_code || t.city_code == city_code))) {
          res.send({ data: "YES" }).status(200);
        }
        else {
          res.send({ data: "NO" }).status(200);
        }
      }
      break;
    }
  }
});

