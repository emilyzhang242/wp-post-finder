let runScriptButton = document.getElementById('runScript');
let posts = document.querySelector('#posts');
let numGoodPosts = document.querySelector('#numGoodPosts');
let wpSite = "https://www.reddit.com/r/WritingPrompts/";
let alarmName = "alarm";
let REFRESH_TIME = 20;
let myAudio = new Audio();        // create the audio object
myAudio.src = "light.mp3";

let GOOD_COMMENT_CUTOFF = 1; 
let GOOD_RATIO_CUTOFF = 40;

function runScript() {
  // button 
  $("#lastRefresh").removeClass("btn-outline-success");
  $("#lastRefresh").addClass("btn-outline-danger");
  
  chrome.runtime.sendMessage({
    action: "runScript"
  });
}

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
  chrome.runtime.sendMessage({
    action: "clearAlarm"
  });
  $("#lastRefresh").removeClass("btn-outline-success");
  $("#lastRefresh").addClass("btn-outline-danger");
}

function buildContent(source) {

  var sorted_array = sortDictionary(source);

	let html = "<h3 class='text-center mt-3'>No Posts</h3>";

  if (Object.keys(source).length != 0) {
    htmlhot = "";
    htmlrising = "";
    $.each(sorted_array, function(key, value) {
    if (value.ratio > GOOD_RATIO_CUTOFF) {
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
      if(timeDiff(grabTime(false)[0], result.time) > REFRESH_TIME) {
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