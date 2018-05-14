let runScriptButton = document.getElementById('runScript');
let posts = document.querySelector('#posts');
let numGoodPosts = document.querySelector('#numGoodPosts');
let wpSite = "https://www.reddit.com/r/WritingPrompts/";
let alarmName = "alarm";
let REFRESH_TIME = 20;
let POPUP_TIME = 5;
let myAudio = new Audio();        // create the audio object
myAudio.src = "light.mp3";

let GOOD_COMMENT_CUTOFF = 1; 
let GOOD_RATIO_CUTOFF = 40;

//want to run the script 
runScriptButton.onclick = function(element) {
	// if is running is true, and we press the button, we want it to stop running, while replacing with a run button
  if ($(this).data("run") == "true") {
    stopRunButton();
    stopScript();
    // start the script, but replace it with a stop running button
  } else {
    runButton();
    runScript();
  }
}

// script is now running
function runButton() {
  $(runScriptButton).html("Stop Script");
    $(runScriptButton).removeClass("btn-success");
    $(runScriptButton).addClass("btn-danger");
    $(runScriptButton).data("run", "true");
}

// script is now stopping
function stopRunButton() {
  $(runScriptButton).html("Run Script");
    $(runScriptButton).removeClass("btn-danger");
    $(runScriptButton).addClass("btn-success");
    $(runScriptButton).data("run", "false");
}

function runScript() {
  //update URL to main page in order to run script
  console.log("running the script now");
  chrome.tabs.getSelected(null, function (tab) {

    chrome.tabs.update(tab.id, {url: wpSite});

      //send message to run script
    chrome.tabs.executeScript(null, {
        file: "content.js"
    }, function() {
      if (chrome.runtime.lastError) {
        console.log('There was an error getting the content.js : \n' + chrome.runtime.lastError.message);
      }
    });
  });
  //clear all alarms before creating a new one
  chrome.alarms.clearAll(function() {
    createAlarm();
    //button 
    $("#lastRefresh").addClass("btn-outline-success");
    $("#lastRefresh").removeClass("btn-outline-danger");

    var time = grabTime(true);
    //set new storage time
    chrome.storage.local.set({"time": time[0]}, function() {
      //
    });
    chrome.storage.local.set({"writtenTime": time[1]}, function() {
      //
    });
  });
}

// returns an array with the [date object, written object]
function grabTime(refresh) {

  var newDate = new Date();
    //hours, am or pm 
    var period = " ";

    var hours = newDate.getHours();
    if (hours>=12) {
      if (hours != 12) {
        hours-=12; 
      }
      period += "pm";  
    } else {
      if (hours == 0) {hours = 12; }
      period += "am";
    }

    var minutes = "";
    if (newDate.getMinutes() < 10) {
      minutes = "0"+newDate.getMinutes().toString();
    } else {
      minutes = newDate.getMinutes().toString();
    }

    var time = hours.toString()+":"+minutes+period;
    if(refresh) {
      $("#lastRefresh").html(time);
    }

    return [newDate.toString(), time];
}

function stopScript() {
  clearAlarm();
  $("#lastRefresh").removeClass("btn-outline-success");
  $("#lastRefresh").addClass("btn-outline-danger");
}

/* LISTENERS */

// receives messages from content.js
chrome.runtime.onMessage.addListener(function(request, sender) {
  console.log("received message");
  //key = tab id, value = url
  var tabs = {};
  var newInfo = request.source;

  if (request.action == "callContent") {
    console.log("listener called for content.js");
    //update badges + audio
    chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
    var numOfPosts = Object.keys(request.source).length.toString();
    chrome.browserAction.setBadgeText({text: numOfPosts});
    if (numOfPosts > 0) {
      myAudio.play();  
    }

    chrome.storage.local.set({"info": newInfo}, function() {
      updatePopup(newInfo);
    });
  }
});

/* END OF LISTENERS */

function buildContent(source) {
	let html = "<h3 class='text-center mt-3'>No Posts</h3>";

  if (Object.keys(source).length != 0) {
    html = "";
    $.each(source, function(key, value) {
    if (value.ratio > GOOD_RATIO_CUTOFF) {
      html+= "<div class='row post post-special'><div class='col-1'><h3 class='prompt-rank'>";
    } else {
      html+= "<div class='row post'><div class='col-1'><h3 class='prompt-rank'>";
    }
    html+= value.rank;
    html+= "</h3></div><div class='col-11'><p class='prompt-title'>";
    html+= value.title;
    html+= "</p><div class='stats'><p class='prompt-upvotes'>";
    html+= value.upvotes;
    html+= " Upvotes</p><p class='prompt-hours'>";
    html+= value.time;
    if (value.comments <= GOOD_COMMENT_CUTOFF) {
      html+= "</p><p class='prompt-comments' style='color: red'>";
    } else {
      html+= "</p><p class='prompt-comments'>";
    }
    html+= value.comments;
    html+= " Comments</p></div></div></div>";
    });
  }

	posts.innerHTML = html;

  return html;
}

// when the popup loads, we want to update it with the storage information
window.onload = function() {
  console.log("update popup 1");
  chrome.storage.local.get(['info'], function(request) {
    console.log(request.info);
  });
  updatePopup();
}

function updatePopup(info) {
  console.log("updating popup");
  chrome.storage.local.get(['time'], function(result) {
      if(timeDiff(grabTime(false)[0], result.time) > POPUP_TIME) {
        console.log("1st");
        runScript();
      } else {
        console.log("other");
        chrome.storage.local.get(['info'], function(inforesult) {
          console.log(inforesult.info);
          buildContent(inforesult.info);
        });

        chrome.storage.local.get(['writtenTime'], function(result2) {
          $("#lastRefresh").html(result2.writtenTime);
        });
      }
    });
}

//don't want to refresh if the time isn't up, in minutes
// either return if we get an actual value, or don't return anything at all
function timeDiff(dt1, dt2) {
  dt1 = Date.parse(dt1);
  dt2 = Date.parse(dt2);
  try {
    var diff =(dt2 - dt1) / 1000;
    diff /= 60;
  } catch(err) {
    return Number.MAX_VALUE;
  }
  return Math.abs(Math.round(diff));
}

/* alarm functionality */
function createAlarm() {
  chrome.alarms.create(alarmName, {periodInMinutes: REFRESH_TIME});
}

function clearAlarm() {
  chrome.alarms.clear(alarmName, function() {
    //
  });
}

chrome.alarms.onAlarm.addListener(function() {
  runScript();
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
        for (key in changes) {
          var storageChange = changes[key];
          console.log('Storage key "%s" in namespace "%s" changed. ' +
                      'Old value was "%s", new value is "%s".',
                      key,
                      namespace,
                      storageChange.oldValue,
                      storageChange.newValue);
        }
      });