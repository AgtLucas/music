var extend = require('extend.js')
var parallel = require('run-parallel')
var util = require('./util')

var LIMIT = 10

var api = new LastFM({
  apiKey: '414cf82dc17438b8c880f237a13e5c09',
  cache: new LastFMCache()
})

function onError (code, message) {
  cb(new Error('LastFM error ' + code + ': ' + message))
}

function trim (text) {
  return text.replace(/\s*\.\s*User-contributed text is available under the Creative Commons By-SA License and may also be available under the GNU FDL\./, '').trim()
}

exports.search = function (q, cb) {
  q = q.trim()
  parallel({
    tracks: function (cb) { exports.trackSearch(q, cb) },
    artists: function (cb) { exports.artistSearch(q, cb) },
    albums: function (cb) { exports.albumSearch(q, cb) }
  }, function (err, r) {
    if (err) return cb(err)

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

exports.trackSearch = function (q, cb) {
  api.track.search({ track: q.trim(), limit: LIMIT }, {
    success: function (data) {
      var tracks = data && data.results && data.results.trackmatches && data.results.trackmatches.track
      if (tracks) {
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
      } else {
        cb(new Error('no tracks'))
      }
    },
    error: onError
  })
}

exports.artistSearch = function (q, cb) {
  api.artist.search({ artist: q.trim(), limit: LIMIT }, {
    success: function (data) {
      var artists = data && data.results && data.results.artistmatches && data.results.artistmatches.artist
      if (artists) {
        artists = artists.map(function (artist) {
          return {
            name: artist.name,
            image: artist.image && artist.image[artist.image.length - 1],
            listeners: Number(artist.listeners) || 0,
            type: 'artist'
          }
        })
        cb(null, artists)
      } else {
        cb(new Error('no artists'))
      }
    },
    error: onError
  })
}

exports.albumSearch = function (q, cb) {
  api.album.search({ album: q.trim(), limit: LIMIT }, {
    success: function (data) {
      var albums = data && data.results && data.results.albummatches && data.results.albummatches.album
      if (albums) {
        albums = albums.map(function (album) {
          return {
            name: album.name,
            artist: album.artist,
            image: album.image && album.image[album.image.length - 1],
            type: 'album'
          }
        })
        cb(null, albums)
      } else {
        cb(new Error('no albums'))
      }
    },
    error: onError
  })
}

exports.artistInfo = function (name, cb) {
  parallel({
    info: function (cb) {
      api.artist.getInfo({ artist: name, autocorrect: 1, limit: 1 }, {
        success: cb.bind(undefined, null),
        error: onError
      })
    },
    tracks: function (cb) {
      api.artist.getTopTracks({ artist: name, autocorrect: 1 }, {
        success: cb.bind(undefined, null),
        error: onError
      })
    },
    albums: function (cb) {
      api.artist.getTopAlbums({ artist: name, autocorrect: 1 }, {
        success: cb.bind(undefined, null),
        error: onError
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
