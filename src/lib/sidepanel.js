chrome.devtools.inspectedWindow.eval("NGN.ref.json", function(ref, isException){
  if (!isException){
    chrome.devtools.inspectedWindow.eval("document.body.classList.remove('unaware')", function(res, isException){
      if (!isException){
        PanelController(ref,true);
        document.getElementById('refs').classList.add('active');
        chrome.extension.sendMessage({
          section: 'references',
          data: Object.keys(ref).length
        });
      } else {
        port.postMessage(JSON.stringify(isException));
      }
    });
  } else {
    port.postMessage(JSON.stringify(isException));
  }
});
