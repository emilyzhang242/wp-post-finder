var NUM_POSTS = 3;
var HOUR_CUTOFF = 12;
var NUM_VOTES_PER_HOUR = 25;
var COMMENT_CUTOFF = 3;
var VOTE_CUTOFF = 500; // the cutoff after which posts shouldn't be looked at 
var postDic = {};
var redditURL = "https://www.reddit.com";
var username = "alannawu";

function getWPcode() {

  var possiblePostURLs = {};
  var start = 0;
  var divPosts = $("html").find("#siteTable");

  var startPost = divPosts.find(".thing").get(0);
  var startRank = $(startPost).find(".rank");

  // there might be pinned posts at top. Ignore those.
  for (var x=0; x < 2; x++) {
    startPost = divPosts.find(".thing").get(x);
    startRank = $(startPost).find(".rank");
    if (startRank.html() != "1") {
      start += 1;
    }
  }

  for (var i=start; i < (NUM_POSTS+start); i++) {
    var post = divPosts.find(".thing").get(i);
    var numVotes = getNumVotes(post);
    var numHours = getNumHours(post);
    var ratio = numVotes/numHours;

    //if the conditions aren't met, then don't need to check comments
    if (ratio >= NUM_VOTES_PER_HOUR && numHours <= HOUR_CUTOFF) {
      var url = getPostHTML(post);
      possiblePostURLs[url] = {"rank": i};
    }
  }	

  return possiblePostURLs;
}

function getNumVotes(post) {
  var votes = $(post).find(".midcol").find(".unvoted").html();

  if ($.isNumeric(votes)) {
    return parseInt(votes);
  } else {
    votes = getVotesFromPage(post);
  }
}

function getNumHours(post) {
  var timestamp = $(post).find(".entry").find(".live-timestamp").html();
  var hours = timestamp.replace(/\D/g, '');
  return parseInt(hours);
}

function getVotesFromPage(post) {
  var url = $(post).data("url");
  console.log(url);
}

function getPostHTML(post) {
  var url = $(post).data("url");
  return redditURL+url;
}

getWPcode();

chrome.runtime.sendMessage({
    action: "getPrelimPossibilities",
    source: getWPcode()
});