// import dependencies and initialize express
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const healthRoutes = require('./routes/health-route');
const swaggerRoutes = require('./routes/swagger-route');

const app = express();

const fs = require('fs').promises
const sample = require('lodash/sample')
const intoStream = require('into-stream')
const Discord = require('discord.js')


const TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');
const { IamAuthenticator } = require('ibm-watson/auth')

const textToSpeech = new TextToSpeechV1({
  // if left unspecified here, the SDK will fall back to the TEXT_TO_SPEECH_USERNAME and TEXT_TO_SPEECH_PASSWORD
  // environment properties, and then IBM Cloud's VCAP_SERVICES environment property
  authenticator: new IamAuthenticator({ apikey: process.env.TEXT_TO_SPEECH_API_KEY })
  //username: process.env.TEXT_TO_SPEECH_USERNAME,
  //password: process.env.TEX_TO_SPEECH_PASSWORD
  //apikey: process.env.TEXT_TO_SPEECH_API_KEY
});

let temp_state = { round: {phase: 0} };
let round_state = { 
    map: {},
    round: {},
    players: [
    ]
}

//const questionsText = await fs.readFile('./qs.json')
//const questions = JSON.parse(questionsText)

const client = new Discord.Client()
client.login(process.env.DISCORD_TOKEN)

//await waitFor(client, 'ready')

console.log('ready')

async function speechStream(args) {
  const response = textToSpeech.synthesizeUsingWebSocket(args);
  response.resume()
  return response
}

function waitFor(emitter, event) {
  return new Promise(resolve => emitter.once(event, resolve))
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}


const withVoice = async cb => {
  const guild = client.guilds.resolve(process.env.DISCORD_GUILD)
  //  const guild = client.guilds[0]
  console.log(guild);
  //  const gen = guild.channels.find(c => c.type === 'text' && c.name === 'General')
  const gen = guild.channels.resolve('525173079731601435')
  //  const vc = guild.channels.find(c => c.type === 'voice' && c.name === 'General')
  const vc = guild.channels.resolve('525173079731601439')
  const voiceConn = await vc.join()
  /*vc.on('speaking', function(event) {
      console.log("event:" + event)
  })*/

  const play = path => waitFor(voiceConn.play(path), 'finish')
  const say = async text => {
    console.log("saying")
/*    const stream = await speechStream({
      input: {text},
      voice: {languageCode: 'en-US', name: 'en-AU-Wavenet-C'},
      audioConfig: {audioEncoding: 'OGG_OPUS'},
    })
    return waitFor(voiceConn.playStream(stream), 'end')
    */
    const stream = await speechStream({
      text,
      accept: 'audio/ogg;codecs=opus',
    })
    console.log(stream)

    //stream.resume();
    ///
    //synthesizeStream.pipe(fs.createWriteStream('./speech.ogg');
    return waitFor(voiceConn.play(stream), 'finish')
    //stream.pipe(process.stdout);
    //return {}
  }

  await cb({play, say})

  voiceConn.disconnect()
}

const trekQuestion = () => withVoice(async ({play, say}) => {
  const {q, as} = sample(questions)
  await play('incoming_hail3.mp3')
  await play('speech.ogg')
  await console.log("sup")

  await say(`
    it\'s time to answer a star trek question.
    ${q}
    is the answer... ${as[0].t}, ${as[1].t}, ${as[2].t}, or ${as[3].t}?
    again, ${q}
    is the answer... ${as[0].t}, ${as[1].t}, ${as[2].t}, or ${as[3].t}?
  `)

  await play('scrsearch.mp3')
  await say('time\'s up! the answer is: ' + as.find(a => a.c).t)
  await play('processing3.mp3')
})

client.on('message', async msg => {
  if (msg.content == '!drink') {
    const online = msg.channel.members.filter(member => member.presence.status === 'online')
    const selected = online.random()
    msg.channel.send(`<@${selected.id}> drinks`)
    await withVoice(async ({play, say}) => {
      await play('alert16.mp3')
      await say(`${selected.user.username} drinks`)
    })
  } else if (msg.content == '!trek') {
    await trekQuestion()
  }
})

// enable parsing of http request body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// routes and api calls
app.use('/health', healthRoutes);
app.use('/swagger', swaggerRoutes);

function clearstate(){
    round_state = {
        map: {},
        round: {},
        players: {}
    }
}

function update_player_state(payload){
  var player_steamid = payload.player.steamid
  round_state.players[player_steamid] = payload.player
}

function update_round_state(payload){
  if ('map' in payload) {
    var map_name = payload.map.name
    round_state.map = payload.map
  }
}


function parsePhase(state, prevState) {
  let changed = false;
  if ('round' in state) {
    if (process.env.DEBUG) {
      console.log('round phase is: ' + state.round.phase);
      console.log('map phase is: ' + state.map.phase);
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

const checkFourKill = () => withVoice(async({play,say}) =>{
  for (var player_id in round_state.players) {
    var kills = round_state.players[player_id].state.round_kills
    var name = round_state.players[player_id].name
    if (kills >= 3) {
      var ev = "DRINK: player: " + name + " kills: " + kills
      console.log(ev)
      await say(ev)
    }
  }
})

const checkRoundStreaks = () => withVoice(async({play,say}) =>{
  var team = "";
  for (var player_id in round_state.players) {
      team = round_state.players[player_id].team
  }
  var team_lookup;
  if (team != "") {
    team_lookup = (team == "CT") ? "team_ct" : "team_t"
    opposing_team_lookup = (team != "CT") ? "team_ct" : "team_t"
  }

  var losses = round_state.map[team_lookup].consecutive_round_losses
  var wins = round_state.map[opposing_team_lookup].consecutive_round_losses
  if (wins >= 3) {
    var ev = "DRINK: team has won " + wins + " rounds in a row"
    console.log(ev)
    await say(ev)
  }
  if (losses >= 3) {
    var ev = "DRINK: team has lost " + losses + " rounds in a row"
    console.log(ev)
    await say(ev)
  }
})

let lastNices = new Set()
const checkNice = () => withVoice(async({play,say}) =>{
  nices = new Set()
  if ((round_state?.map?.team_ct?.score === 6 && round_state?.map?.team_ct?.score === 9) || (round_state?.map?.team_ct?.score === 9 && round_state?.map?.team_ct?.score === 6)) {
    nices.add(`the score is 6 9. nice.`)
  }
  for (const player of Object.values(round_state.players)) {
    if (player.state.round_kills === 69) {
      nices.add(`${player.name} has 69 kills. nice.`)
    }
    if (player.state.health === 69) {
      nices.add(`${player.name} has 69 health. nice.`)
    }
    if (player.state.armor === 69) {
      nices.add(`${player.name} has 69 armor. nice.`)
    }
    if (player.state.money === 6900) {
      nices.add(`${player.name} has 6900 dollars. nice.`)
    }
    if (player.match_stats.score === 69) {
      nices.add(`${player.name} has 69 points. nice.`)
    }
  }
  for (const msg of nices) {
    if (!lastNices.has(msg)) {
        await say(msg)
    }
  }
  lastNices = nices
})

let lastBlazes = new Set()
const checkBlazes = () => withVoice(async({play,say}) =>{
  blazes = new Set()
  for (const player of Object.values(round_state.players)) {
    if (player.state.smoked) {
      blazes.add(`${player.name} is blazing it.`)
    }
    if (player.state.burning) {
      blazes.add(`${player.name} is burning it.`)
    }
  }
  for (const msg of blazes) {
    if (!lastBlazes.has(msg)) {
        await say(msg)
    }
  }
  lastBlazes = blazes
})

function performAllChecks(){
  checkFourKill();
  checkRoundStreaks();
  checkNice()
  checkBlazes()
}
function performAllUpdates(state){

  update_player_state(state);
  update_round_state(state);
}

// what to do with a new game state payload
app.post('/', (req, res) => {
  let state = req.body;
  if (process.env.DEBUG) {
    console.log(req.body.player.weapons);
    console.log(round_state.players);
  }
  if ('round' in state) {
      if (parsePhase(state, temp_state)) {
        console.log('New Round');
        performAllUpdates(state);
        performAllChecks();

        clearstate();
      } else {
        performAllUpdates(state);
      }

      temp_state = state;
  }
  res.send('ok');
});

// serve up data
app.get('/data.json', (req,res)  => {
  res.send(round_state)
})

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
