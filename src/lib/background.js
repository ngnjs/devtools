var TABS = [];

chrome.extension.onConnect.addListener(function(port) {
  if (port.name === 'NGNInspector') {
    port.onMessage.addListener(function(msg) {
      if (msg.tab) {
        if (TABS.indexOf(msg.tab) < 0){
          TABS.push(msg.tab);
        }
      } else {
        console.log(msg);
      }
    });

    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
      if (tab.status === 'complete' && TABS.indexOf(tab.id) >= 0){
        port.postMessage('refresh');
      }
    });

  }
});

chrome.extension.onMessage.addListener(function (msg, _, sendResponse) {
  console.log(chrome.tabs, TABS);
  console.log(msg, _, sendResponse);
});
// chrome.experimental.socket.create('tcp', '127.0.0.1', 8080, function(socketInfo) {
//   chrome.experimental.socket.connect(socketInfo.socketId, function (result) {
//         chrome.experimental.socket.write(socketInfo.socketId, "Hello, world!");
//     });
// });
