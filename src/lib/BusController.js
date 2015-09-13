var BusController = function(bus,onHover){
  onHover = typeof onHover === 'boolean' ? onHover : false;
  var src = bus.subscribers;
  var data = Object.keys(src).sort().map(function(topic){
    var o = src[topic];
    o.name = topic;
    o.wildcard = topic.indexOf('*') >= 0;
    return o;
  });
  // alert(JSON.stringify(data))
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "../assets/views/bus.html", false);
  xhr.send();
  var tpl = Handlebars.compile(xhr.responseText);
  var html = tpl({
    list: data
  });
  var evt = document.getElementById('bus');

  evt.innerHTML = html;
};
