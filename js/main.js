var $ = window.jQuery = require('jquery')
require('velocity-animate')

require('./search')

var parallel = require('run-parallel')
var domready = require('domready')
var lastfm = require('./lastfm')
var view = require('./view')
var youtube = require('./youtube')

var TYPE_RE = /^\/([^\/]+)\/([^\/]+)\/?/i

domready(onReady)

function onReady () {
  parallel({
    api: youtube.loadAPI,
    info: function (cb) {
      var parsed = parseUrl(window.location.pathname)
      getInfo(parsed.type, parsed.q, function (err, info) {
        if (err) throw err
        show(info)
      })
    }
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

function parseUrl (href) {
  var re = href.match(TYPE_RE)
  var type = re && re[1]
  if (type && type === 'track' || type === 'artist' || type === 'album') {
    var q = re && re[2]
    q = decodeURIComponent(q.replace(/-/g, ' '))
    return {
      type: type,
      q: q
    }
  } else {
    return null
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

$(document).on('click', 'a', function (evt) {
  var href = $(this).attr('href')
  var parsed = parseUrl(href)
  if (parsed.type === 'track') {
    player.yt.pauseVideo()
  }
  getInfo(parsed.type, parsed.q, function (err, info) {
    if (err) throw err
    show(info)
  })
  evt.preventDefault()
})
