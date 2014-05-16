var EventEmitter = require('events').EventEmitter
var inherits = require('inherits')
var util = require('./util')

var API_TIMEOUT = 10000

exports.loadAPI = function (cb) {
  var tag = document.createElement('script')
  tag.src = 'https://www.youtube.com/iframe_api'
  var firstScriptTag = document.getElementsByTagName('script')[0]
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

  var timeout = setTimeout(function () {
    cb(new Error('timeout loading YouTube API'))
  }, API_TIMEOUT)

  window.onYouTubeIframeAPIReady = function () {
    clearTimeout(timeout)
    cb()
  }
}

exports.getVideoId = function (title, artist, cb) {
  title = title || ''
  artist = artist || ''
  var q = title + ' ' + artist

  // Restrict search to embeddable videos with format=5
  var url = 'http://gdata.youtube.com/feeds/api/videos'
  var params = {
    alt: 'jsonc',
    format: 5,
    'max-results': 1,
    q: q,
    v: 2
  }

  util.jsonp(url, params, function (err, data) {
    if (err) return cb(err)
    var id = data.data.items && data.data.items[0] && data.data.items[0].id
    if (id) {
      cb(null, id)
    } else {
      cb(new Error('no youtube video for ' + title + ' ' + artist))
    }
  })
}

exports.Player = Player

inherits(Player, EventEmitter)

function Player (videoId, node) {
  var self = this
  EventEmitter.call(self)

  self.yt = new YT.Player(node, {
    height: '390',
    width: '640',
    videoId: videoId,
    events: {
      'onReady': self.emit.bind(self, 'ready'),
      'onStateChange': self.emit.bind(self, 'stateChange')
    },
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      enablejsapi: 1,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 0,
      origin: undefined, // TODO
      playsinline: 1,
      rel: 0,
      showinfo: 0
    }
  })

}
