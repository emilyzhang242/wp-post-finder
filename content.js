var NUM_POSTS = 10;
var HOUR_CUTOFF = 12;
var NUM_VOTES_PER_HOUR = 20;
var NUM_VOTES_PER_RISING = 10;
var COMMENT_CUTOFF = 3;
var postDic = {};
var redditURL = "https://www.reddit.com";
var username = "alannawu";
var haveZeroComments = false;

function createWPDictionary() {
  var hotDict = getWPcode($("html").find("#siteTable"), "hot");
  var risingDict = {};
  $.ajax({
    url: "https://www.reddit.com/r/WritingPrompts/rising/",
    type: "GET",
    async: false,
    success: function(response) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(response, "text/html");
      risingDict = getWPcode($(doc).find("#siteTable"), "rising");
    },
    error: function(response) {
          console.log("error: "+response);
    }
  });
  $.extend(hotDict, risingDict);
  console.log(JSON.stringify(hotDict));
  console.log(hotDict);
  return hotDict;

}

function getWPcode(divPosts, type) {
  console.log("running WP");

  var possiblePostURLs = {};
  var start = 0;

  var startPost = divPosts.find(".thing").get(0);
  var startRank = $(startPost).find(".rank");

  // there might be pinned posts at top. Ignore those.
  if (type == "hot") {
    for (var x=0; x < 2; x++) {
      startPost = divPosts.find(".thing").get(x);
      startRank = $(startPost).find(".rank");
      if (startRank.html() != "1") {
        start += 1;
      }
    }
  }

  var numPosts = NUM_POSTS+start;
  var divLength = divPosts.children(".thing").length;
  if (divLength < numPosts) {
    numPosts = divLength;
  }

  // code for hot posts 
  for (var i=start; i < numPosts; i++) {
    var post = divPosts.find(".thing").get(i);
    var url = getPostHTML(post);
    var numVotes = getNumVotes(post, url);
    var numHours = getNumHours(post);
    var ratio = numVotes/numHours;

    //if the conditions aren't met, then don't need to check comments
    if ((ratio >= NUM_VOTES_PER_HOUR && numHours <= HOUR_CUTOFF && type=="hot") ||
        (numVotes > 5 && type=="rising")) {
      console.log('conditions met');
      var timestamp = $(post).find(".entry").find(".live-timestamp").html();
      var title = getTitle(post);
      var comments = getComments(url);
      var rank = $(post).find(".rank").html();

      if (comments <= COMMENT_CUTOFF) {

        if (comments == 0 && type == "hot") {
          haveZeroComments = true;
        }

        possiblePostURLs[url] = {"rank": parseInt(rank), "time": timestamp, "upvotes": numVotes, 
                                  "title": title, "comments": comments, "ratio": ratio, "type": type,
                                  "url": url, "numHours": numHours};
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
    var parser = new DOMParser();
    var doc = parser.parseFromString(html_string, "text/html");
    var children = $(doc).find(".commentarea").find(".nestedlisting").children(".thing");
    return children.length-1;
}

function getNumVotes(post, url) {
  var votes = $(post).find(".midcol").find(".unvoted").html();
  votes.replace(",", "");
  if ($.isNumeric(votes)) {
    return parseInt(votes);
  } else {
    votes = getVotesFromPage(url);
  }
  return votes;
}

/* edge cases: could say 1 day ago or minutes ago. Must take that into account. */
function getNumHours(post) {
  var timestamp = $(post).find(".entry").find(".live-timestamp").html();
  var number = timestamp.replace(/\D/g, '');

  if (timestamp.includes("minute")) {
    return parseInt(number/60.0);
  } else if (timestamp.includes("day")) {
    return 24;
  } else if (timestamp.includes("an hour")) {
    return 1;
  }
  return parseInt(number);
}

function getVotesFromPage(url) {
  var votes = -1;

  $.ajax({
    url: url,
    type: "GET",
    async: false,
    success: function(response) {
      votes = getNumVotesFromPage(response);
    },
    error: function(response) {
          console.log("error: "+response);
    }
  });

  return votes;
}

function getNumVotesFromPage(html_string) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(html_string, "text/html");
    var num = $(doc).find(".side").find(".score").find(".number").html();
    num.replace(",", "");
    return parseInt(num);
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
    action: "callContent",
    source: createWPDictionary(),
    haveGoodPosts: haveZeroComments 
});