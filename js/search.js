var $ = require('jquery')
var lastfm = require('./lastfm')
var view = require('./view')
var throttle = require('lodash.throttle')

var $search = $('#search')
var $searchInput = $('#search input')
$searchInput.on('keyup', throttle(doSearch, 300, { trailing: true }))
$searchInput.on('focus', doSearch)

$(document).on('click', '.exitBtn', function (evt) {
  $searchInput.val('')
  $search.removeClass('hasText')
  view.clearView()
})

var lastSearch
var $body = $('body')
function doSearch () {
  var q = $searchInput.val().trim()
  if (q.length === 0) {
    view.clearView()
    $search.removeClass('hasText')
    return
  }
  $search.addClass('hasText')

  if (q === lastSearch) {
    return
  }

  $body.addClass('searching')
  lastfm.search(q, function (err, results) {
    if (err) throw err
    if ($searchInput.val().trim() !== q) {
      return
    }
    $body.removeClass('searching')
    view.renderResults(results)
  })
  lastSearch = q
}
