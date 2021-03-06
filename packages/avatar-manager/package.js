Package.describe({
  name: 'selaias:avatar-manager-manually-modified',
  version: '0.4.0',
  summary: 'Manage your avatar. Upload an imag or select one from the available list (linked accounts).',
  git: 'https://github.com/selaias/avatar-manager.git',
  documentation: 'README.md'
});

var both = ['client', 'server'];

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.2');
  api.use([
    'ecmascript', 
    'check',
    'underscore', 
    'accounts-base',
    'accounts-password',
    'selaias:avatar-upload-manually-modified@1.4.0', 
    'utilities:avatar@0.9.2', 
    ], both);
  
  api.use(['templating', 'twbs:bootstrap@3.3.6'], 'client');
  
  api.imply(['jparker:gravatar@0.3.1', 'utilities:avatar@0.9.2'], both);
    
  api.addFiles('lib/both/avatar-manager.js', both);
  
  api.addFiles('lib/client/helpers.js', 'client');
  api.addFiles('lib/client/avatar-manager-template.html', 'client');
  api.addFiles('lib/client/avatar-manager-template.js', 'client');
  
  api.export('AvatarManager', both);
});
