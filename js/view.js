var $ = require('jquery')
var fs = require('fs')
var lastfm = require('./lastfm')
var mustache = require('mustache')
var throttle = require('lodash.throttle')
var youtube = require('./youtube')

window.player = undefined

// Templates
var ARTIST = fs.readFileSync(__dirname + '/../templates/artist.html', 'utf8')

function onError (err) {
  alert('Error: ' + err.message)
}

function render (template, data) {
  document.querySelector('#view').innerHTML = mustache.render(template, data)
}

function updateBackground (src) {
  $('#background').css({
    'background-image': 'url(' + src + ')'
  })
}

function cueVideo (id) {
  if (player === undefined) {
    player = new youtube.Player(id, document.querySelector('#player'))
  } else {
    player.yt.playVideo()
  }
}

exports.showTrack = function (info) {
  if (info.type !== 'track') throw new Error('not a track')
  youtube.getVideoId(info.name, info.artist, function (err, id) {
    if (err) return onError(err)
    cueVideo(id)
    player.once('ready', function () {
      player.yt.playVideo()
    })
  })
}

exports.showArtist = function (name) {
  lastfm.artistInfo(name, function (err, artist) {
    if (err) return onError(err)
    render(ARTIST, artist)
    updateBackground(artist.image)
  })
}

exports.showAlbum = function (info) {
  if (info.type !== 'album') throw new Error('not an album')

}

var $document = $(document)
var $body = $('body')
var inactiveTimeout
function onInactive () {
  if (inactiveTimeout) {
    clearTimeout(inactiveTimeout)
    inactiveTimeout = null
  }
  $body.addClass('inactive')
}

$document.on('mousemove', throttle(function () {
  if (inactiveTimeout) {
    clearTimeout(inactiveTimeout)
  } else {
    $body.removeClass('inactive')
  }
  inactiveTimeout = setTimeout(onInactive, 3000)
}, 500, { leading: true, trailing: true }))
