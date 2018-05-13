var NUM_POSTS = 15;
var HOUR_CUTOFF = 10;
var NUM_VOTES_PER_HOUR = 25;
var NUM_VOTES_PER_RISING = 10;
var COMMENT_CUTOFF = 3;
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
      var timestamp = $(post).find(".entry").find(".live-timestamp").html();
      var title = getTitle(post);
      var comments = getComments(url);

      if (comments <= COMMENT_CUTOFF) {
        possiblePostURLs[url] = {"rank": i-1, "time": timestamp, "upvotes": numVotes, "title": title, "comments": comments};
      }
    }
  }	
  return possiblePostURLs;
}

function getComments(url) {

  var num = -1;

  $.ajax({
    url: url,
    type: "GET",
    async: false,
    success: function(response) {
      num = getNumComments(response);
    },
    error: function(response) {
          console.log("error: "+response);
    }
  });

  return num;
}

/* returns the number of comments on the individual page, -1 is for the bot comment */
function getNumComments(html_string) {
    var htmlObject = document.createElement('div');
    $(htmlObject).attr("id", "dominfo")
    $(htmlObject).html(html_string);

    var parser = new DOMParser();
    var doc = parser.parseFromString(html_string, "text/html");
    var children = $(doc).find(".commentarea").find(".nestedlisting").children(".thing");
    return children.length-1;

}

function getNumVotes(post) {
  var votes = $(post).find(".midcol").find(".unvoted").html();

  if ($.isNumeric(votes)) {
    return parseInt(votes);
  } else {
    votes = getVotesFromPage(post);
  }
}

/* edge cases: could say 1 day ago or minutes ago. Must take that into account. */
function getNumHours(post) {
  var timestamp = $(post).find(".entry").find(".live-timestamp").html();
  var number = timestamp.replace(/\D/g, '');

  if (timestamp.includes("minute")) {
    return parseInt(number/60.0);
  } else if (timestamp.includes("day")) {
    return 24;
  } else {
    return parseInt(number);
  }

  return parseInt(number);
}

/* FINISH THIS STUPID */
function getVotesFromPage(post) {
  var url = $(post).data("url");
  console.log(url);
}

function getPostHTML(post) {
  var url = $(post).data("url");
  return redditURL+url;
}

function getTitle(post) {
  var title = $(post).find(".entry").find("a").html();
  return title;
}

chrome.runtime.sendMessage({
    action: "getPrelimPossibilities",
    source: getWPcode()
});