var $ = require('jquery')
var lastfm = require('./lastfm')
var view = require('./view')

var $search = $('#search')
var $searchInput = $('#search input')
$searchInput.on('keyup', doSearch)
$searchInput.on('focus', doSearch)

$(document).on('click', '.exitBtn', function (evt) {
  $searchInput.val('')
  $search.removeClass('hasText')
  view.clearView()
})

function doSearch () {
  var q = $searchInput.val().trim()
  if (q.length === 0) {
    view.clearView()
    $search.removeClass('hasText')
    return
  }
  $search.addClass('hasText')
  lastfm.search(q, function (err, results) {
    if (err) throw err
    view.renderResults(results)
  })
}
