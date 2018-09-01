android-release ::
	cordova build android
	jarsigner -verbose -tsa http://timestamp.digicert.com -tsacert Socialtext -sigalg SHA1withRSA -digestalg SHA1 -keystore ~/Socialtext.keystore platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk Socialtext
	zipalign -fv 4 platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk app-release.apk
