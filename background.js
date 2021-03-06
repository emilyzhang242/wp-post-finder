let alarmName = "alarm";
let REFRESH_TIME = 20;
let wpSite = "https://www.reddit.com/r/WritingPrompts/";
let myAudio = new Audio();        // create the audio object
let goodAudio = new Audio();
myAudio.src = "sounds/light.mp3";
goodAudio.src = "sounds/serious-strike.mp3";
let runGoodAudio = false;

// chrome.runtime.onInstalled.addListener(function() {
//     chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
//       chrome.declarativeContent.onPageChanged.addRules([{
//         conditions: [new chrome.declarativeContent.PageStateMatcher({
//           pageUrl: {urlMatches: 'reddit.com/r/WritingPrompts/$'},
//         })
//         ],
//             actions: [new chrome.declarativeContent.ShowPageAction()]
//       }]);
//     });
// });

console.log("background is running");
runScript();
chrome.storage.local.set({"isRunning": true}, function() {
      //
});

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

function runScript() {
  console.log("background running the script");
  chrome.tabs.query({url: wpSite}, function (tab) {

    if (tab.length == 0) {
      chrome.tabs.create({url: wpSite}, function() {});
    } else {
      chrome.tabs.update(tab[0].id, {url: wpSite, highlighted: true});
    }

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

/* LISTENERS */

// receives messages from content.js
chrome.runtime.onMessage.addListener(function(request, sender) {
  console.log("received message called "+request.action);

  if (request.action == "callContent") {
    console.log("listener called for content.js");
    //update badges + audio
    chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
    var numOfPosts = Object.keys(request.source).length.toString();
    chrome.browserAction.setBadgeText({text: numOfPosts});
    if (numOfPosts > 0 && request.haveGoodPosts == true) {
      goodAudio.play();
    } else if (numOfPosts > 0) {
      myAudio.play(); 
    }
    chrome.storage.local.set({"info": request.source}, function() {
    });
    //send message to change the popup to update
    console.log("sending updatepopup message");
    chrome.runtime.sendMessage({
      action: "updatePopup"
    });

  } else if (request.action == "runScript") {
    runScript();
  } else if (request.action == "createAlarm") {
    createAlarm();
  } else if (request.action == "clearAlarm") {
    clearAlarm();
  }
});