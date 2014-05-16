var $ = require('jquery')
var lastfm = require('./lastfm')
var view = require('./view')

var $search = $('#search')
$search.on('keyup', function () {
  var q = $search.val().trim()
  if (q.length === 0) {
    return
  }
  lastfm.search(q, function (err, results) {
    if (err) throw err
    console.log(results)
    view.showResults({
      tracks: results.tracks
    })
  })
})
