chrome.devtools.panels.create("NGN",
  "assets/images/toolbarLogo.png",
  "../panel.html",
  function(panel) {
    var shown = false;
    panel.onShown.addListener(function(currentPanel){
      if (!shown){
        shown = true;
        var port = chrome.runtime.connect({ name : 'NGNInspector' }),
            tabId = chrome.devtools.inspectedWindow.tabId;

        // Tell the background process which tab(s) use NGN.
        port.postMessage({
          tab: tabId
        });

        // Handle messages received from background.js
        port.onMessage.addListener(function (msg) {
          if (msg === 'refresh') {
            shown = false;
            currentPanel.location.reload(true);
          }
        });

        // Update the panel ref content
        chrome.devtools.inspectedWindow.eval("NGN.ref", function(ref, isException){
          if (!isException){
            console.log(ref.json);
            currentPanel.updateReferences(ref.json);
          } else {
            port.postMessage(JSON.stringify(isException));
          }
        });

        // Update the panel ref content
        chrome.devtools.inspectedWindow.eval("NGN.BUS", function(bus, isException){
          if (!isException){
            currentPanel.updateBUS(bus);
          } else {
            port.postMessage(JSON.stringify(isException));
          }
        });
      }
    });
  }
);

chrome.devtools.panels.elements.createSidebarPane(
  "NGN",
  function(sidebar) {
    sidebar.setPage("../sidebar.html");
    var shown = false;
    sidebar.onShown.addListener(function(currentPanel){
      if (!shown){
        shown = true;
        var port = chrome.runtime.connect({ name : 'NGNInspector' }),
            tabId = chrome.devtools.inspectedWindow.tabId;

        // Tell the background process which tab(s) use NGN.
        port.postMessage({
          tab: tabId
        });

        // Handle messages received from background.js
        port.onMessage.addListener(function (msg) {
          if (msg === 'refresh') {
            port.postMessage('sidebar should refresh');
            sidebar.setPage("../sidebar.html");
          } else {
            alert(msg);
          }
        });

        // Ghetto hack to expand the height of the sidebar appropriately.
        setTimeout(function () {
          chrome.devtools.inspectedWindow.eval('NGN.ref.json', function (res, isException) {
            if (!isException){
              var refCount = Object.keys(res).length;
              var height = refCount*30; // Account for each row

              // Get any expanded references
              Object.keys(res).forEach(function(ref) {
                chrome.devtools.inspectedWindow.eval('NGN.ref.'+ref+'.length', function(val,isE) {
                  if (val !== undefined){
                    height += (val*18); // Account for expanded rows
                  }
                });
              });

              setTimeout(function () {
                height += 30; // account for header space & buffer
                sidebar.setHeight(height+'px');
                // sidebar.setHeight('100vh')
              },200);
            } else {
              port.postMessage(JSON.stringify(isException));
            }
          });
          // alert(Object.keys(currentPanel));
        },300)

        chrome.devtools.panels.elements.onSelectionChanged.addListener(function() {
          port.postMessage(">>>>"+JSON.stringify(arguments));
        });
      }
    });
  }
);
