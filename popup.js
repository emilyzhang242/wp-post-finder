let runScriptButton = document.getElementById('runScript');
let posts = document.querySelector('#posts');
let numGoodPosts = document.querySelector('#numGoodPosts');
let wpSite = "https://www.reddit.com/r/WritingPrompts/";
let alarmName = "alarm";
let REFRESH_TIME = 20;

let GOOD_COMMENT_CUTOFF = 1; 
let GOOD_RATIO_CUTOFF = 40;
let GOOD_HOUR_CUTOFF = 5;

/* WHEN THE POPUP LOADS */

// when the popup loads, we want to update it with the storage information
window.onload = function() {
  console.log("update popup 1");
  chrome.storage.local.get(['info'], function(request) {
  });
  updateRunScriptButton();
  updatePopup();
}

/* This function updates the UI for the button and the outline for the time */
function updateRunScriptButton() {
  //update the runscript button 
  chrome.storage.local.get(['isRunning'], function(request) {
    console.log("is it running? "+request.isRunning);
    // if currently running, we want the button to show "stop running"
    if (request.isRunning) {
      //update outline
      $("#lastRefresh").addClass("btn-outline-success");
      $("#lastRefresh").removeClass("btn-outline-danger");
      //update button contents
      buttonSaysStop();
    } else {
      $("#lastRefresh").removeClass("btn-outline-success");
      $("#lastRefresh").addClass("btn-outline-danger");
      buttonSaysRun();
    }
  });
}

/* END WHEN THE POPUP LOADS */

/* RUN SCRIPT FUNCTIONALITY */

function runScript() {
  chrome.storage.local.set({"isRunning": true}, function() {
      //
  });

  chrome.runtime.sendMessage({
    action: "runScript"
  });
}

function stopScript() {
  chrome.runtime.sendMessage({
    action: "clearAlarm"
  });

  chrome.storage.local.set({"isRunning": false}, function() {
      //
  });
}

//want to run the script 
runScriptButton.onclick = function(element) {
	// if is running is true, and we press the button, we want it to stop running, while replacing with a run button
  chrome.storage.local.get(['isRunning'], function(request) {
    console.log(request.isRunning);
    if (request.isRunning) {
      stopScript();
    } else {
      runScript();
    }
    updateRunScriptButton();
    updatePopup();
  });
}

/* END RUN SCRIPT FUNCTIONALITY */

$("input[name=post]").on("change", function() {
  //hide the correct one 
  var type = $("input[name=post]:checked").val();
  if (type == "hot") {
    $(".rising").hide();
    $(".hot").show();
  } else {
    $(".hot").hide();
    $(".rising").show();
  }
});

// script is now running, so replace it with the top button
function buttonSaysStop() {
  $(runScriptButton).html("Stop Script");
  $(runScriptButton).removeClass("btn-success");
  $(runScriptButton).addClass("btn-danger");
  $(runScriptButton).data("run", "true");
}

// script is now stopping, so replace it with the run button
function buttonSaysRun() {
  $(runScriptButton).html("Run Script");
  $(runScriptButton).removeClass("btn-danger");
  $(runScriptButton).addClass("btn-success");
  $(runScriptButton).data("run", "false");
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

function buildContent(source) {

  var sorted_array = sortDictionary(source);

	let html = "<h3 class='text-center mt-3'>No Posts</h3>";

  if (Object.keys(source).length != 0) {
    htmlhot = "";
    htmlrising = "";
    $.each(sorted_array, function(key, value) {
    if (value.ratio >= GOOD_RATIO_CUTOFF) {
      window["html"+value.type]+= "<div class='row post post-special "+value.type+"'><div class='col-1'><h3 class='prompt-rank'>";
    } else {
      window["html"+value.type]+= "<div class='row post "+value.type+"'><div class='col-1'><h3 class='prompt-rank'>";
    }
    window["html"+value.type]+= value.rank;
    window["html"+value.type]+= "</h3></div><div class='col-11'><p class='prompt-title'>";
    window["html"+value.type]+= value.title;
    window["html"+value.type]+= "</p><div class='stats'><p class='prompt-upvotes'>";
    window["html"+value.type]+= value.upvotes;
    window["html"+value.type]+= " Upvotes</p><p class='prompt-hours'>";
    window["html"+value.type]+= value.time;
    if (value.comments <= GOOD_COMMENT_CUTOFF) {
      window["html"+value.type]+= "</p><p class='prompt-comments' style='color: red'>";
    } else {
      window["html"+value.type]+= "</p><p class='prompt-comments'>";
    }
    window["html"+value.type]+= value.comments;
    window["html"+value.type]+= " Comments</p></div></div></div>";
    });

    html = htmlhot + htmlrising;
  }

	posts.innerHTML = html;

  //hide the correct one 
  var type = $("input[name=post]:checked").val();
  if (type == "hot") {
    $(".rising").hide();
  } else {
    $(".hot").hide();
  }

  return html;
}

function sortDictionary(dic) {
  console.log("sorting dictionary");
  console.log(dic);
  var array = [];

  $.each(dic, function(key, value) {
    array.push(value);
  });
  console.log(array);
  array.sort(function(a,b) {
    return a.rank - b.rank;
  });

  return array;
}

function updatePopup() {
  console.log("updating popup");
  chrome.storage.local.get(['time'], function(result) {
      if(timeDiff(grabTime(false)[0], result.time) > REFRESH_TIME) {
        console.log("1st");
        runScript();
      } else {
        console.log("other");
        chrome.storage.local.get(['info'], function(inforesult) {
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