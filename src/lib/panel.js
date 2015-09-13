var updateReferences = PanelController;
var updateBUS = BusController;

var tabs = Array.prototype.slice.call(document.querySelectorAll('body > nav > a'));

var changeTab = function(e){
  e.preventDefault();
  document.querySelector('a.active').classList.remove('active');
  document.querySelector('section.active').classList.remove('active');
  var id = e.currentTarget.getAttribute('href').replace('#','');
  document.querySelector('a[href="'+id+'"]').classList.add('active');
  document.querySelector('section#'+id).classList.add('active');
};

tabs.forEach(function(tab){
  tab.addEventListener('click',changeTab);
});
