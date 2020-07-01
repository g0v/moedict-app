# moedict-app
Stand-alone MoeDict app snapshot

This branch is dedicated to the mobile app versions of Amis-moedict (阿美語萌典)

## Short how-to:

1. clone this repo 
2. checkout cordova8-amis branch
3. install android-sdk 
4. `npm install cordova -g` to install Cordova
5. `cordova plateform add android` to add android files
6. copy the content of `amis-deploy` directory in `amis-moedict` to `www`
7. `cordova run android` to try the android version (in a connected phone or a pre-configured emulator)

## Important things to avoid failure:

- be sure to have set the `$ANDROID_SDK_ROOT` environment variable (pointing to your android-skd installation) 
- be sure to have the android `platform-tools` in your `$PATH` environment variable
- you may want to `cordova plateform add browser` for faster testing and easier debugging


