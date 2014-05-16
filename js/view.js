var player

var lastfm = require('./lastfm')
var youtube = require('./youtube')

function cueVideo (id) {
  if (player === undefined) {
    player = new youtube.Player(id, document.querySelector('.player'))
  } else {
    player.yt.playVideo()
  }
}

exports.showTrack = function (info) {
  if (info.type !== 'track') throw new Error('not a track')
  youtube.getVideoId(info.name, info.artist, function (err, id) {
    cueVideo(id)
    player.once('ready', function () {
      player.yt.playVideo()
    })
  })
}

exports.showArtist = function (info) {
  if (info.type !== 'artist') throw new Error('not a track')

}

exports.showAlbum = function (info) {
  if (info.type !== 'album') throw new Error('not a track')

}
