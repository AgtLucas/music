var domready = require('domready')
var lastfm = require('./lastfm')
var series = require('run-series')
var parallel = require('run-parallel')
var auto = require('run-auto')
var url = require('url')
var youtube = require('./youtube')

var TYPE_RE = /^\/([^\/]+)\/([^\/]+)\/?/i

domready(function () {
  auto({
    api: youtube.loadAPI,
    info: getInfoFromLocation
  }, function (err, r) {
    if (err) throw err
    if (r.info.type === 'track') {
      playTrack(r.info)
    }
  })
})

function getInfoFromLocation (cb) {
  var loc = url.parse(window.location.href)
  var re = loc.path.match(TYPE_RE)
  var type = re && re[1]
  if (type) {
    // load something
    var q = re && re[2]
    q = decodeURIComponent(q.replace('-', ' '))
    if (type === 'track') {
      getTrackInfo(q, cb)
    }
  } else {
    // homepage
  }
}

function getTrackInfo (q, cb) {
  lastfm.trackSearch(q, function (err, tracks) {
    cb(err, tracks && tracks[0])
  })
}

function getArtistInfo (q, cb) {
  lastfm.artistSearch(q, function (err, artists) {
    cb(err, artists && artists[0])
  })
}

function getAlbumInfo (q, cb) {
  lastfm.albumSearch(q, function (err, albums) {
    cb(err, albums && tracks[0])
  })
}

var player

function cueVideo (id) {
  if (player === undefined) {
    player = new youtube.Player(id, document.querySelector('.player'))
  } else {
    player.yt.playVideo()
  }
}

function playTrack (info) {
  if (info.type !== 'track') {
    throw new Error('can only play tracks')
  }
  youtube.getVideoId(info.name, info.artist, function (err, id) {
    cueVideo(id)
    player.once('ready', function () {
      console.log('ready')
      // player.yt.playVideo()
    })
  })
}
