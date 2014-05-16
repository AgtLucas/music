var $ = window.jQuery = require('jquery')
require('velocity-animate')

require('./search')

var parallel = require('run-parallel')
var domready = require('domready')
var lastfm = require('./lastfm')
var view = require('./view')
var youtube = require('./youtube')

var TYPE_RE = /^\/([^\/]+)(?:\/([^\/]+))?(?:\/([^\/]+))?\/?/i

domready(onReady)

function onReady () {
  parallel({
    api: youtube.loadAPI,
    info: function (cb) {
      var parsed = parseUrl(window.location.pathname)
      show(parsed)
    }
  }, function (err, r) {
    if (err) throw err
    show(r.info)
  })
}

function parseUrl (href) {
  var re = href.match(TYPE_RE)
  var type = re && re[1]
  var name = decodeURIComponent((re && re[2]).replace(/-/g, ' '))

  if (type && type === 'track' || type === 'album') {
    var artist = decodeURIComponent((re && re[3]).replace(/-/g, ' '))
    return {
      type: type,
      name: name,
      artist: artist
    }
  } else if (type && type === 'artist') {
    return {
      type: type,
      name: name
    }
  } else {
    return null
  }
}

function show (info) {

  function renderFirst (err, items) {
    if (err) {
      alert(err.message)
    }
    var item = items && items[0]
    if (!item) {
      alert('no item found')
    }
    if (item.type === 'track') {
      view.renderTrack(item)
    } else if (item.type === 'artist') {
      view.renderArtist(item.name)
    } else if (item.type === 'album') {
      view.renderAlbum(item)
    }

    history.pushState({}, '', item.url)

  }

  if (info.type === 'track') {
    lastfm.trackSearch(info.name, info.artist, renderFirst)
  } else if (info.type === 'artist') {
    lastfm.artistSearch(info.name, renderFirst)
  } else if (info.type === 'album') {
    lastfm.albumSearch(info.name, info.artist, renderFirst)
  } else {
    throw new Error('unrecognized type ' + info.type)
  }
}

$(document).on('click', 'a', function (evt) {
  view.clearView()
  var href = $(this).attr('href')
  var parsed = parseUrl(href)
  if (parsed.type === 'track') {
    player.yt.pauseVideo()
  }
  show(parsed)
  evt.preventDefault()
})
