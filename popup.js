let runScriptButton = document.getElementById('runScript');
let posts = document.querySelector('#posts');
let numGoodPosts = document.querySelector('#numGoodPosts');
let wpSite = "https://www.reddit.com/r/WritingPrompts/";
let info;



//want to run the script 
runScriptButton.onclick = function(element) {
	// if is running is true, and we press the button, we want it to stop running, while replacing with a run button
  if ($(this).data("run") == "true") {
    $(this).html("Run Script");
    $(this).removeClass("btn-danger");
    $(this).addClass("btn-success");
    $(this).data("run", "true");
    stopScript();
    // start the script, but replace it with a stop running button
  } else {
    $(this).html("Stop Script");
    $(this).removeClass("btn-success");
    $(this).addClass("btn-danger");
    $(this).data("run", "false");
    runScript();
  }
}

function runScript() {
  //update URL to main page in order to run script
  chrome.tabs.getSelected(null, function (tab) {
    chrome.tabs.update(tab.id, {url: wpSite});

      //send message to run script
    chrome.tabs.executeScript(null, {
        file: "content.js"
    }, function() {

    });
  });
  //clear all alarms before creating a new one
  chrome.alarms.clearAll(function() {
    createAlarm();
  })
}

function stopScript() {
  clearAlarm();
}

/* LISTENERS */

//
chrome.runtime.onMessage.addListener(function(request, sender) {
  if (request.action == "getSource") {
    //message.innerText = request.source;
  }
});

chrome.runtime.onMessage.addListener(function(request, sender) {
  if (request.action == "getPrelimPossibilities") {
    let html = buildContent(request.source);
    posts.innerHTML = html;
    info = request.source;
    //update all the comments
    $.each(request.source, function(key, value) {
      chrome.tabs.getSelected(null, function (tab) {
        chrome.tabs.update(tab.id, {url: key}, function() {
          chrome.tabs.onUpdated.addListener(function() {
            var num = onWindowLoad();
            console.log(num);
          });
        });
      });
    });
  }
});

/* END OF LISTENERS */

function onWindowLoad() {

  chrome.tabs.executeScript(null, {
    file: "getPageSource.js"
  }, function() {
    // If you try and inject into an extensions page or the webstore/NTP you'll get an error
    if (chrome.runtime.lastError) {
      message.innerText = 'There was an error getting the HTML : \n' + chrome.runtime.lastError.message;
    }
  });
}

function buildContent(source) {
	let html = "";

	$.each(source, function(key, value) {
		html+= "<div class='row post'><div class='col-1'><h3 class='prompt-rank'>";
		html+= value.rank;
		html+= "</h3></div><div class='col-11'><p class='prompt-title'>";
		html+= value.title;
		html+= "</p><div class='stats'><p class='prompt-upvotes'>";
		html+= value.upvotes;
		html+= " Upvotes</p><p class='prompt-hours'>";
		html+= value.time;
		html+= "</p></div></div></div>";

	});

	return html;
}

/* ON LOAD */
window.onload = runScript;
let alarmName = "alarm";
createAlarm();

/* alarm functionality */
function createAlarm() {
  chrome.alarms.create(alarmName, {periodInMinutes: 1});
}

function clearAlarm() {
  chrome.alarms.clear(alarmName, function() {
    //
  });
}

chrome.alarms.onAlarm.addListener(function() {
  runScript();
});