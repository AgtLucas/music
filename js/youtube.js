var $ = require('jquery')
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
      'onStateChange': self.emit.bind(self, 'stateChange'),
      'onPlaybackQualityChange': self.emit.bind(self, 'playbackQualityChange'),
      'onError': self.emit.bind(self, 'error'),
      'onApiChange': self.emit.bind(self, 'apiChange')
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

  self.on('stateChange', function (data) {
    var state = data.data
    if (state === YT.PlayerState.ENDED) {
      self.emit('ended')
    } else if (state === YT.PlayerState.PLAYING) {
      self.emit('playing')
    } else if (state === YT.PlayerState.PAUSED) {
      self.emit('paused')
    } else if (state === YT.PlayerState.BUFFERING) {
      self.emit('buffering')
    } else if (state === YT.PlayerState.CUED) {
      self.emit('cued')
    }
  })

  var interval
  function startInterval () {
    interval = setInterval(function () {
      var time = self.yt.getCurrentTime()
      self.emit('timeupdate', time)
    }, 250)
  }
  function endInterval () {
    clearInterval(interval)
  }

  self.on('playing', function () { startInterval() })
  self.on('paused', function () { endInterval() })
  self.on('ended', function () { endInterval() })

  // UI
  self.on('timeupdate', function (time) {
    setProgress(time)
  })

  var $progress = $('.progress')
  var $time = $('.time')
  function setProgress (time) {
    var duration = self.yt.getDuration()
    var fraction = time / duration
    $progress.css({ width: (fraction * 100) + '%' })
    $time.text(formatTime(time))
  }

  var $timeline = $('.timeline')
  function getTimelineFraction (evt) {
    var relativeX = evt.pageX - $timeline[0].getBoundingClientRect().left
    var fraction = relativeX / $timeline[0].clientWidth
    return Math.max(0, Math.min(1, fraction))
  }

  $(document).on('click', '.timeline', function (evt) {
    var fraction = getTimelineFraction(evt)
    var duration = self.yt.getDuration()
    var time = fraction * duration
    self.yt.seekTo(time)
    setProgress(time)
  })
}

/**
 * Convert time in secs to a nicely formatted string.
 * @param  {number} time (in secs)
 * @return {string} nicely formatted string e.g. '3:23'
 */
function formatTime (time) {
  var hours = Math.floor(time / 3600)
  var mins = Math.floor((time - hours * 3600) / 60)
  var secs = Math.floor(time - (hours * 3600) - (mins * 60))

  if (secs < 10) {
    secs = '0' + secs
  }

  if (hours > 0) {
    if (mins < 10) {
        mins = '0' + mins
    }
    return hours + ':' + mins + ':' + secs
  } else {
    return mins + ':' + secs
  }
}
