var $ = window.jQuery = require('jquery')
require('velocity-animate')
var key = require('keymaster')

var parallel = require('run-parallel')
var domready = require('domready')
var lastfm = require('./lastfm')
var url = require('url')
var view = require('./view')
var youtube = require('./youtube')

var TYPE_RE = /^\/([^\/]+)\/([^\/]+)\/?/i

domready(onReady)

function onReady () {
  parallel({
    api: youtube.loadAPI,
    info: getInfoFromLocation
  }, function (err, r) {
    if (err) throw err
    show(r.info)
  })
}

function show (info) {
  if (info.type === 'track') {
    view.showTrack(info)
  } else if (info.type === 'artist') {
    view.showArtist(info.name)
  } else if (info.type === 'album') {
    view.showAlbum(info)
  }
}

function getInfoFromLocation (cb) {
  var loc = url.parse(window.location.href)
  var re = loc.path.match(TYPE_RE)
  var type = re && re[1]
  if (type && type === 'track' || type === 'artist' || type === 'album') {
    // load item
    var q = re && re[2]
    q = decodeURIComponent(q.replace('-', ' '))
    getInfo(type, q, cb)
  } else {
    // load homepage

  }
}

function getInfo (type, q, cb) {
  if (type === 'track') {
    lastfm.trackSearch(q, function (err, infos) {
      cb(err, infos && infos[0])
    })
  } else if (type === 'artist') {
    lastfm.artistSearch(q, function (err, artists) {
      cb(err, artists && artists[0])
    })
  } else if (type === 'album') {
    lastfm.albumSearch(q, function (err, albums) {
      cb(err, albums && tracks[0])
    })
  } else {
    cb(new Error('unrecognized type ' + type))
  }
}

key('space', function () {
  var state = player.yt.getPlayerState()
  if (state === YT.PlayerState.PLAYING) {
    player.yt.pauseVideo()
  } else if (state === YT.PlayerState.PAUSED) {
    player.yt.playVideo()
  }
})
