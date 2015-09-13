require('localenvironment');
var MustHave = require('musthave'),
    mh = new MustHave(),
    https = require('https'),
    fs = require('fs'),
    path = require('path'),
    wrench = require('wrench'),
    google = require('googleapis'),
    archiver = require('archiver'),
    request = require('request'),
    aws = require('aws-sdk');

mh.hasAll( process.env,
  'GOOGLE_CLIENT_ID',
  'GOOGLE_APP_ID',
  'GOOGLE_USER_EMAIL',
  'AWS_KEY',
  'AWS_SECRET',
  'AWS_S3_REGION',
  'AWS_S3_BUCKET',
  'AWS_S3_FILEPATH'
);

var src = path.resolve(path.join('.','src'));
var dist = path.resolve(path.join('.','release'));

// Retrieve the service account file (from S3), as well as PEM for app
console.log('Retrieving security credentials...');

var s3 = new aws.S3({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
  region: process.env.AWS_S3_REGION,
  sslEnabled: true,
  endpoint: 'https://{service}.amazonaws.com'
});

s3.getObject({
  Bucket: process.env.AWS_S3_BUCKET,
  Key: process.env.AWS_S3_FILEPATH
}, function (err, filecontent) {
  if (err) throw err;
  // console.log(filecontent.Body);
  fs.writeFileSync(path.join('.','google_key.json'),filecontent.Body);
  // process.exit(0);

  // Remove any existing distribution/release directory
  console.log('Cleaning up distribution directories...');
  if (fs.existsSync(dist)){
    wrench.rmdirSyncRecursive(dist, true);
  }
  fs.mkdirSync(dist);
  if (fs.existsSync(path.join(src,'ngn.zip'))){
    fs.unlinkSync(path.join(src,'ngn.zip'));
  }

  // Copy the release to the distribution directory
  console.log('Copying source files...')
  wrench.copyDirSyncRecursive(src, dist, {
    forceDelete: true, // Whether to overwrite existing directory or not
    excludeHiddenUnix: true, // Whether to copy hidden Unix files or not (preceding .)
    preserveFiles: false, // If we're overwriting something and the file already exists, keep the existing
    preserveTimestamps: true, // Preserve the mtime and atime when copying files
    inflateSymlinks: true // Whether to follow symlinks or not when copying files
    // exclude: regexpOrFunction // An exclude filter (either a regexp or a function)
  });

  var app = require(path.join(dist,'manifest.json');
  process.env.APP_NAME = app.name;
  process.env.APP_VERSION = app.version;

  // Copy the key to the release directory
  console.log('Copying private key for distribution...');
  fs.createReadStream(path.join(src,'..','key.pem')).pipe(fs.createWriteStream(path.join(dist,'key.pem')));

  console.log('Creating distributable zip file...');
  var output = fs.createWriteStream('ngn.zip');
  var archive = archiver('zip');

  output.on('close', function () {
    console.log(archive.pointer() + ' total bytes');
    console.log('Distributable created.');

    // Setup service client
    console.log('Authenticating/authorizing with Google...');

    var jwtClient = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_ID,
      path.join('.','google_key.json'),
      null,
      ['https://www.googleapis.com/auth/chromewebstore']
      , process.env.GOOGLE_USER_EMAIL
    );

    jwtClient.authorize(function(err, tokens) {
      // Cleanup auth
      fs.unlinkSync(path.join('.','google_key.json'));

      if (err) {
        console.log(err);
        return;
      }

      console.log('Authentication successful.');

      // Begin timeout counter
      setTimeout(function () {
        console.error('Timed out attempting to publish to Chrome Web Store.');
        fs.unlinkSync('ngn.zip');
        wrench.rmdirSyncRecursive(dist, true);
        process.exit(1);
      }, (3 * 60 * 1000));

      // Publish
      console.log('Submitting to Google web store...');
      request.put({
        uri: 'https://www.googleapis.com/upload/chromewebstore/v1.1/items/'+process.env.GOOGLE_APP_ID,
        headers: {
          Authorization: 'Bearer ' + tokens.access_token,
          'x-goog-api-version': '2'
        },
        body: fs.readFileSync('ngn.zip')
      }, function (err, res, data) {
        if (err) throw err;
        data = typeof data === 'string' ? JSON.parse(data) : data;
        if (data.uploadState){
          if (data.uploadState === 'SUCCESS'){
            // Remove unnecessary files
            fs.unlinkSync('ngn.zip');
            wrench.rmdirSyncRecursive(dist, true);
            console.log('Submission complete. Google will verify before publishing.');
            process.exit(0);
          }
        }
        if (data.error){
          console.log(data.error.errors[0].message);
        }
        fs.unlinkSync('ngn.zip');
        wrench.rmdirSyncRecursive(dist, true);
        process.exit(1);
      });
    });

  });

  // Begin archiving file (zip)
  archive.on('error', function(err){
      throw err;
  });

  archive.pipe(output);
  archive.bulk([
      { expand: true, cwd: dist, src: ['**'], dest: 'ngn' }
  ]);
  archive.finalize();

});
