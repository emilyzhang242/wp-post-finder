chrome.runtime.onInstalled.addListener(function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
      chrome.declarativeContent.onPageChanged.addRules([{
        conditions: [new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {urlMatches: 'reddit.com/r/WritingPrompts/'},
        })
        ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
      }]);
    });
  });


// chrome.tabs.onUpdated.addListener(function (tabId , info) {
//     console.log(tabId);
//     console.log(info);
//     if (info.status === 'complete') {
//       	// your code ...
//     	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//     		var activeTab = tabs[0];
//     		chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
//   		});
//     }
// });

// Called when the user clicks on the browser action.
// chrome.browserAction.onClicked.addListener(function(tab) {
//   // Send a message to the active tab
//   console.log("CLICK CLICK");
//   chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//     var activeTab = tabs[0];
//     chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
//   });
// });

// chrome.browserAction.onClicked.addListener(function(tab) {
//   chrome.storage.sync.get('state', function(data) {
//     if (data.state === 'on') {
//       chrome.storage.sync.set({state: 'off'});
//         //do something, removing the script or whatever
//         clearInterval(interval);
//         alert('script ended');
//     } else {
//       chrome.storage.sync.set({state: 'on'});
//         interval = setInterval(getWPcode, 100000);
//         alert("script started");
//     }
//   });
// });