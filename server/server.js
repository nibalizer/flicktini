// import dependencies and initialize express
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const healthRoutes = require('./routes/health-route');
const swaggerRoutes = require('./routes/swagger-route');

const app = express();

let temp_state = { round: 0 };

// enable parsing of http request body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// routes and api calls
app.use('/health', healthRoutes);
app.use('/swagger', swaggerRoutes);

function parsePhase(state, prevState) {
  let changed = false;
  if ('round' in state) {
    if (process.env.DEBUG) {
      console.log('game state is: ' + state.round.phase);
    }
    if (prevState.round.phase !== state.round.phase) {
      changed = true;
      // round just ended
    }
    if (state.round.phase === 'over' && changed) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

app.post('/', (req, res) => {
  let state = req.body;
  if (process.env.DEBUG) {
    console.log(req.body);
  }
  if (parsePhase(state, temp_state)) {
    console.log('New Round');
  }

  temp_state = state;
});

// default path to serve up index.html (single page application)
app.all('', (req, res) => {
  res.status(200).sendFile(path.join(__dirname, '../public', 'index.html'));
});

// start node server
const port = process.env.PORT || 4500;
app.listen(port, () => {
  console.log(`App UI available http://localhost:${port}`);
  console.log(`Swagger UI available http://localhost:${port}/swagger/api-docs`);
});

// error handler for unmatched routes or api calls
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, '../public', '404.html'));
});

module.exports = app;
