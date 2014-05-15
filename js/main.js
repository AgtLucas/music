var lastfm = require('./lastfm')
var series = require('run-series')
var youtube = require('./youtube')

lastfm.search('can\'t stop won\'t stop', function (err, results) {
  console.log(err, results)
})

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
