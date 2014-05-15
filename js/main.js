var series = require('run-series')
var youtube = require('./youtube')

// series([
//   youtube.loadAPI,

//   function (cb) {
//     youtube.getSong('every new day', 'five iron frenzy', function (err, song) {
//       console.log(song)
//       var playerDiv = document.querySelector('.player')
//       var player = new youtube.Player(song, playerDiv)
//       player.on('ready', function () {
//         console.log('ready')
//       })

//     })
//   }
// ])
