var PanelController = function(ref,onHover){
  onHover = typeof onHover === 'boolean' ? onHover : false;
  var data = Object.keys(ref).map(function(nm,i){
    // alert("document.querySelectorAll('"+ref[nm]+"')");
    chrome.devtools.inspectedWindow.eval("document.querySelectorAll('"+ref[nm]+"')", function(els){
      els = Object.keys(els);
      if (els.length > 1){
        var row = '#refs > table > tbody > tr:nth-child('+(i+1)+')';
        els.length > 1 && document.querySelector(row).classList.add('collapsed');
        document.querySelector(row).setAttribute('data-items', els.length);
        document.querySelector(row+' > td:first-child').setAttribute('data-items', els.length);
      }
    });
    return {
      name: nm,
      selector: ref[nm]
    };
  });
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "../assets/views/refs.html", false);
  xhr.send();
  var tpl = Handlebars.compile(xhr.responseText);
  var html = tpl({
    list: data
  });
  var refs = document.getElementById('refs');
  refs.innerHTML = html;
  var rows = refs.querySelectorAll('table > tbody > tr');

  var highlightSelector = function(ev) {
    var str = ev.currentTarget.querySelector('code').innerHTML.replace(/&gt;/gi,'>');
    chrome.devtools.inspectedWindow.eval("inspect(document.querySelector('"+str+"'))");
  };

  var toggle = function(el){
    if (el.classList.contains('expanded')){
      el.classList.add('collapsed');
      el.classList.remove('expanded');
      return;
    }
    if (!el.classList.contains('collapsed')){
      return;
    }
    var refNm = el.querySelector('td:first-of-type').textContent;
    if (document.querySelector('table > tbody > tr[reference="'+refNm+'"] > td > div') === null){
      var main = document.createElement('div');
      for (var i=1; i<parseInt(el.getAttribute('data-items')); i++){
        var li = document.createElement('li');
        li.addEventListener(onHover?'mouseover':'click',highlightSelector);
        var code = document.createElement('code');
        code.appendChild(document.createTextNode(el.children[1].children[0].innerHTML.replace(/&gt;/gi,'>')+':nth-child('+(i+1)+')'));
        li.appendChild(code);
        main.appendChild(li);
      }
      el.children[1].appendChild(main);
    }
    el.classList.add('expanded');
    el.classList.remove('collapsed');
  };

  for (var i=0;i<rows.length;i++){
    rows[i].addEventListener('dblclick',function(e){
      toggle(e.currentTarget);
    });
    rows[i].querySelector('td:first-of-type').addEventListener('click',function(e){
      toggle(e.currentTarget.parentNode);
    });
    rows[i].querySelector('td:last-of-type > code').addEventListener(onHover?'mouseover':'click',function(e){
      var str = e.currentTarget.innerHTML.replace(/&gt;/gi,'>');
      chrome.devtools.inspectedWindow.eval("inspect(document.querySelectorAll('"+str+"')[0])");
    });
  };

  if (rows.length > 0){
    var navbar = document.querySelector('body.unaware');
    if (navbar){
      navbar.classList.remove('unaware');
    }
  }
};
