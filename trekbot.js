const fs = require('fs').promises
const sample = require('lodash/sample')
const intoStream = require('into-stream')
const Discord = require('discord.js')
//const textToSpeech = require('@google-cloud/text-to-speech')

//const tts = new textToSpeech.TextToSpeechClient()

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

function waitFor(emitter, event) {
  return new Promise(resolve => emitter.once(event, resolve))
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/*
async function speechStream(args) {
  const response = await tts.synthesizeSpeech(args)
  return intoStream(response[0].audioContent)
}
*/


async function speechStream(args) {
  const response = textToSpeech.synthesizeUsingWebSocket(args);
  response.resume()
  return response
}


async function main() {
  const questionsText = await fs.readFile('./qs.json')
  const questions = JSON.parse(questionsText)

  const client = new Discord.Client()
  client.login(process.env.DISCORD_TOKEN)

  await waitFor(client, 'ready')

  console.log('ready')

  const guild = client.guilds.resolve(process.env.DISCORD_GUILD)
//  const guild = client.guilds[0]
  console.log(guild);
//  const gen = guild.channels.find(c => c.type === 'text' && c.name === 'General')
  const gen = guild.channels.resolve('525173079731601435')
//  const vc = guild.channels.find(c => c.type === 'voice' && c.name === 'General')
  const vc = guild.channels.resolve('525173079731601439')

  const withVoice = async cb => {
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
    //await say('foo');
    
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

  //setInterval(trekQuestion, 1 * 60 * 1000)
  setTimeout(trekQuestion, 500)
}

main()
