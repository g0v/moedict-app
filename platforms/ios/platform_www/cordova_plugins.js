cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
  {
    "id": "cordova-plugin-splashscreen.SplashScreen",
    "file": "plugins/cordova-plugin-splashscreen/www/splashscreen.js",
    "pluginId": "cordova-plugin-splashscreen",
    "clobbers": [
      "navigator.splashscreen"
    ]
  }
];
module.exports.metadata = 
// TOP OF METADATA
{
  "cordova-plugin-splashscreen": "5.0.2",
  "cordova-plugin-whitelist": "1.3.3"
};
// BOTTOM OF METADATA
});