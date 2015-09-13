/**
 * This is a script used by the shippable continuous integration system.
 * It is not designed to be used directly in a worker script.
 */
var HipChat = require('node-hipchat'),
    hc = new HipChat(process.env.HIPCHAT_TOKEN);

// Remove first arguments (node and script)
process.argv.shift();
process.argv.shift();

var args = {};
process.argv.forEach(function(el,i){
  if (el.substr(0,2) === "--"){
    args[el.substr(2,el.length)] = process.argv[i+1];
  }
});


// Defaults
args.color = args.color || 'yellow';
args.success = args.success || "true";
args.success = args.success === "true";

var app = require(path.join(process.cwd(),'src','manifest.json'));

var msg = app.name+" v"+app.version+": <a href=\""+process.env.BUILD_URL+"\">Build "+process.env.BUILD_NUMBER+"</a> of "
        + "<a href=\""+process.env.REPOSITORY_URL.replace('ssh://git@','https://').replace('.git','')+"\"><b>"+process.env.REPO_NAME+"</b> ("+process.env.BRANCH+" branch)</a> "
        + (args.success ? 'succeeded.' : '<b>failed</b>.');

if (args.message){
  msg += "<br/>"+args.message;
}

var params = {
  room: process.env.HIPCHAT_ROOM_ID,
  from: process.env.USER,
  message: msg,
  color: args.success ? 'green' : 'red',
  notify: true
};

console.log('Sending to room: ',process.env.HIPCHAT_ROOM_ID+':');
console.log(msg);
hc.postMessage(params);
