# flicktini

> NOTE: this is highly beta and will probably set your computer on fire

A discord bot that gives out drinking instructions based on the status of a csgo game

## Setup

On your csgo computer, put the following `game state integration` file into place:

Docs on where this file goes are [here](https://github.com/nibalizer/csgo_documentation/blob/master/README.md#game-state-integration). Docs on what this file does are [here](https://developer.valvesoftware.com/wiki/Counter-Strike:_Global_Offensive_Game_State_Integration).


```
"Observer All Players v.1"
{
 "uri" "http://<ip of node app>:4500"
 "timeout" "5.0"
 "buffer"  "0.1"
 "throttle" "0.1"
 "heartbeat" "30.0"
 "auth"
 {
   "token" "REDACTED"
 }
 "data"
 {
   "provider"            "1"      // general info about client being listened to: game name, appid, client steamid, etc.
   "map"                 "1"      // map, gamemode, and current match phase ('warmup', 'intermission', 'gameover', 'live') and current score
   "round"               "1"      // round phase ('freezetime', 'over', 'live'), bomb state ('planted', 'exploded', 'defused'), and round winner (if any)
   "player_id"           "1"      // player name, clan tag, observer slot (ie key to press to observe this player) and team
   "player_state"        "1"      // player state for this current round such as health, armor, kills this round, etc.
   "player_weapons"      "1"      // output equipped weapons.
   "player_match_stats"  "1"      // player stats this match such as kill, assists, score, deaths and MVPs
   "allplayers_id"       "1"      // Same as 'player_id' but for all players. 'allplayers' versions are only valid for HLTV and observers
   "player_state"        "1"      
   "allplayers_state"    "1"      
   "allplayers_match_stats"  "1"  
   "allplayers_weapons"  "1"      
   "allplayers_position" "1"      // output the player world positions, only valid for HLTV or spectators. 
   "phase_countdowns"    "1"      // countdowns of each second remaining for game phases, eg round time left, time until bomb explode, freezetime. Only valid for HLTV or spectators. 
   "allgrenades"    "1"           // output information about all grenades and inferno flames in the world, only valid for GOTV or spectators.
 }
}
```


## App

```
npm install
npm start
```


## Example csgo payload


```
{
  provider: {
    name: 'Counter-Strike: Global Offensive',
    appid: 730,
    version: 13747,
    steamid: '<readcated>',
    timestamp: 1580000032
  },
  map: {
    mode: 'casual',
    name: 'de_cache',
    phase: 'live',
    round: 5,
    team_ct: {
      score: 4,
      consecutive_round_losses: 0,
      timeouts_remaining: 1,
      matches_won_this_series: 0
    },
    team_t: {
      score: 1,
      name: '[xirv]',
      consecutive_round_losses: 2,
      timeouts_remaining: 1,
      matches_won_this_series: 0
    },
    num_matches_to_win_series: 0,
    current_spectators: 0,
    souvenirs_total: 0
  },
  round: { phase: 'live' },
  player: {
    steamid: '<redacted>',
    clan: '[xirv]',
    name: 'CSGO Player 3',
    observer_slot: 6,
    team: 'T',
    activity: 'playing',
    state: {
      health: 100,
      armor: 100,
      helmet: true,
      flashed: 0,
      smoked: 0,
      burning: 0,
      money: 7300,
      round_kills: 0,
      round_killhs: 0,
      equip_value: 3900
    },
    weapons: {
      weapon_0: [Object],
      weapon_1: [Object],
      weapon_2: [Object],
      weapon_3: [Object]
    },
    match_stats: { kills: 7, assists: 0, deaths: 4, mvps: 1, score: 18 }
  },
  auth: { token: 'REDACTED' }
}
```
