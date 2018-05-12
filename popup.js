let changeColor = document.getElementById('runScript');

chrome.storage.sync.get('color', function(data) {
	changeColor.style.backgroundColor = data.color;
	changeColor.setAttribute('value', data.color);
});

changeColor.onclick = function(element) {
    // let color = element.target.value;
    // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    //   chrome.tabs.executeScript(
    //       tabs[0].id,
    //       {code: 'document.body.style.backgroundColor = "' + color + '";'});
    // });

    try {
        chrome.tabs.getSelected(null, function (tab) {
            chrome.tabs.sendRequest(tab.id, {action: "getSource"}, function(source) {
                alert(source);
            });
        });
    }
    catch (ex) {
        alert(ex);
    }
};

chrome.runtime.onMessage.addListener(function(request, sender) {
  if (request.action == "getSource") {
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

window.onload = onWindowLoad;