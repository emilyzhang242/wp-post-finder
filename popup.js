let runScript = document.getElementById('runScript');
var message = document.querySelector('#message');
let wpSite = "https://www.reddit.com/r/WritingPrompts/"

//want to run the script 
runScript.onclick = function(element) {
	// send message to run content

	//update URL to main page in order to run script
	chrome.tabs.getSelected(null, function (tab) {
  		chrome.tabs.update(tab.id, {url: wpSite});
  	});

	//send message to run script
	chrome.tabs.executeScript(null, {
    	file: "content.js"
  	}, function() {
  		//
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
    message.innerText = request.source;
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

//window.onload = onWindowLoad;