let runScript = document.getElementById('runScript');
var posts = document.querySelector('#posts');
let wpSite = "https://www.reddit.com/r/WritingPrompts/"

//want to run the script 
runScript.onclick = function(element) {
	// send message to run content

	//update URL to main page in order to run script
	chrome.tabs.getSelected(null, function (tab) {
  		chrome.tabs.update(tab.id, {url: wpSite});

  		//send message to run script
		chrome.tabs.executeScript(null, {
    		file: "content.js"
  		}, function() {
  			//
  		});
  	});

    // let color = element.target.value;
    // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    //   chrome.tabs.executeScript(
    //       tabs[0].id,
    //       {code: 'document.body.style.backgroundColor = "' + color + '";'});
    // });

    // try {
    //     chrome.tabs.getSelected(null, function (tab) {
    //         chrome.tabs.sendRequest(tab.id, {action: "getSource"}, function(source) {
    //             alert(source);
    //         });
    //     });
    // }
    // catch (ex) {
    //     alert(ex);
    // }
};
/* LISTENERS */

chrome.runtime.onMessage.addListener(function(request, sender) {
  if (request.action == "getSource") {
    //message.innerText = request.source;
  }
});

chrome.runtime.onMessage.addListener(function(request, sender) {
  if (request.action == "getPrelimPossibilities") {
    let html = buildContent(request.source);
    posts.innerHTML = html;
  }
});

function onWindowLoad() {

  var message = document.querySelector('#message');

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
		html+= "<div class='row post'><div class='col-sm-1 col-md-1 col-xs-1'><button class='btn btn-outline-primary prompt-rank'>";
		html+= value.rank;
		html+= "</button></div><div class='col-sm-11 col-md-11 col-xs-11'><p class='prompt-title'>";
		html+= value.title;
		html+= "</p><div class='stats'><p class='prompt-upvotes'>";
		html+= value.upvotes;
		html+= "</p><p class='prompt-hours'>";
		html+= value.time;
		html+= "</p></div></div></div>";

	});

	return html;
}

//window.onload = onWindowLoad;