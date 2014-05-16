var extend = require('extend.js')
var parallel = require('run-parallel')
var util = require('./util')

var api = new LastFM({
  apiKey: '414cf82dc17438b8c880f237a13e5c09',
  cache: new LastFMCache()
})

function onError (cb) {
  return function (code, message) {
    cb(new Error('LastFM error ' + code + ': ' + message))
  }
}

function trim (text) {
  return text.replace(/\s*\.\s*User-contributed text is available under the Creative Commons By-SA License and may also be available under the GNU FDL\./, '').trim()
}

function toUrl (item) {
  function clean (s) {
    return encodeURIComponent(s.replace(/ /g, '-'))
  }

  return '/' + item.type + '/' + clean(item.name) + (item.artist ? '/' + clean(item.artist) : '')
}

exports.search = function (q, cb) {
  q = q.trim()
  parallel({
    tracks: function (cb) { exports.trackSearch(q, cb) },
    artists: function (cb) { exports.artistSearch(q, cb) },
    albums: function (cb) { exports.albumSearch(q, cb) }
  }, function (err, r) {
    if (err) return cb(err)
    Object.keys(r).forEach(function (type) {
      r[type].forEach(function (item) {
        item.url = toUrl(item)
      })
    })
    cb(null, r)
  })
}

exports.searchMerged = function (q, cb) {
  q = q.trim()
  parallel({
    tracks: function (cb) { exports.trackSearch(q, cb) },
    artists: function (cb) { exports.artistSearch(q, cb) },
    albums: function (cb) { exports.albumSearch(q, cb) }
  }, function (err, r) {
    if (err) return cb(err)

    Object.keys(r).forEach(function (type) {
      r[type] = r[type].map(function (item) {
        item.url = toUrl(item)
      })
    })

    var results = []

    // sort exact matches first
    var topTrack = r.tracks[0]
    if (topTrack && topTrack.name === q) {
      results.push(topTrack)
      r.tracks.splice(0, 1)
    }
    var topArtist = r.artists[0]
    if (topArtist && topArtist.name === q) {
      results.push(topArtist)
      r.artists.splice(0, 1)
    }
    var topAlbum = r.albums[0]
    if (topAlbum && topAlbum.name === q) {
      results.push(topAlbum)
      r.albums.splice(0, 1)
    }

    // Tracks and artists have a "listeners" count, sort most popular first
    var tracksAndArists = r.tracks.concat(r.artists)
    tracksAndArists.sort(function (a, b) {
      return b.listeners - a.listeners
    })

    // Add albums at the end
    results = results.concat(tracksAndArists, r.albums)

    cb(null, results)
  })
}

exports.trackSearch = function (track, artist, cb) {
  if (typeof artist === 'function') {
    cb = artist
    artist = ''
  }
  track = track.trim()
  artist = artist.trim()
  api.track.search({ track: track, artist: artist, limit: 7 }, {
    success: function (data) {
      var tracks = data && data.results && data.results.trackmatches && data.results.trackmatches.track

      if (!tracks) {
        tracks = []
      }
      if (!Array.isArray(tracks)) {
        tracks = [tracks]
      }

      tracks = tracks.map(function (track) {
        return {
          name: track.name,
          artist: track.artist,
          image: track.image && track.image[track.image.length - 1],
          listeners: Number(track.listeners) || 0,
          type: 'track'
        }
      })
      cb(null, tracks)
    },
    error: onError(cb)
  })
}

exports.artistSearch = function (q, cb) {
  api.artist.search({ artist: q.trim(), limit: 1 }, {
    success: function (data) {
      var artists = data && data.results && data.results.artistmatches && data.results.artistmatches.artist

      if (!artists) {
        artists = []
      }
      if (!Array.isArray(artists)) {
        artists = [artists]
      }

      artists = artists.map(function (artist) {
        return {
          name: artist.name,
          image: artist.image && artist.image[artist.image.length - 1]['#text'],
          listeners: Number(artist.listeners) || 0,
          type: 'artist'
        }
      })
      cb(null, artists)
    },
    error: onError(cb)
  })
}

exports.albumSearch = function (q, cb) {
  api.album.search({ album: q.trim(), limit: 6 }, {
    success: function (data) {
      var albums = data && data.results && data.results.albummatches && data.results.albummatches.album

      if (!albums) {
        albums = []
      }
      if (!Array.isArray(albums)) {
        albums = [albums]
      }

      albums = albums.map(function (album) {
        return {
          name: album.name,
          artist: album.artist,
          image: album.image && album.image[album.image.length - 1]['#text'],
          type: 'album'
        }
      })
      cb(null, albums)
    },
    error: onError(cb)
  })
}

exports.artistInfo = function (name, cb) {
  parallel({
    info: function (cb) {
      api.artist.getInfo({ artist: name, autocorrect: 1, limit: 1 }, {
        success: cb.bind(undefined, null),
        error: onError(cb)
      })
    },
    tracks: function (cb) {
      api.artist.getTopTracks({ artist: name, autocorrect: 1 }, {
        success: cb.bind(undefined, null),
        error: onError(cb)
      })
    },
    albums: function (cb) {
      api.artist.getTopAlbums({ artist: name, autocorrect: 1 }, {
        success: cb.bind(undefined, null),
        error: onError(cb)
      })
    }
  }, function (err, r) {
    if (err) return cb(err)
    var info = r.info && r.info.artist
    var tracks = r.tracks && r.tracks.toptracks && r.tracks.toptracks.track
    var albums = r.albums && r.albums.topalbums && r.albums.topalbums.album

    var artist = {
      name: info.name,
      listeners: info.stats.listeners,
      bio: trim(util.sanitizeHTML(info.bio && info.bio.summary)),
      bioLong: trim(util.sanitizeHTML(info.bio && info.bio.content)),
      image: info.image[info.image.length - 1]['#text'],
      tracks: tracks,
      albums: albums,
      type: 'artist'
    }

    cb(null, artist)
  })
}

exports.albumInfo = function (album) {}
