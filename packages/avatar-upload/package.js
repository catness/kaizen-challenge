Package.describe({
  summary: "simple upload avatar package for meteor",
  version: "1.4.0",
  name: "selaias:avatar-upload-manually-modified",
  git: "https://github.com/selaias/avatar-upload.git"    
});

var both = ['client', 'server'];
var client = ['client'];
var server = ['server'];

Package.onUse(function (api) {
  api.versionsFrom("METEOR@1.2.0.2");

  api.use(['underscore', 'accounts-base', 'accounts-password'], both);
  api.use(['jquery', 'templating', 'twbs:bootstrap@3.3.6'], client);

  //add file
  api.addFiles([
    'src/helpers.js'
  ], both);

  api.addAssets([
    'src/vendor/imgareaselect/border-anim-h.gif',
    'src/vendor/imgareaselect/border-anim-v.gif',
  ], client);

  api.addFiles([
    'src/vendor/imgareaselect/imgareaselect-animated.css',
    'src/vendor/imgareaselect/jquery.imgareaselect.pack.js',
    'src/client.js',
    'src/template/editYourAvatarModal.html',
    'src/template/editYourAvatarModal.js',
    'src/template/editYourAvatarModal.css'
  ], client);

  api.add_files([
    'src/server.js',
  ], server);
});

Package.onTest(function (api) {
  api.use(['selaias:avatar-upload','accounts-password','tinytest'], both);
  api.addFiles('tests/client.js', 'client');
  api.addFiles('tests/server.js', 'server');
});