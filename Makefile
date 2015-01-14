copy :: res/icons/android/drawable-hdpi/icon.png
	rsync -av --delete --copy-links base/ www

android :: before_prepare
	cp -Rf res/icons/android/* platforms/android/res/
	rsync -avzP --delete www platforms/android/assets
	cp platforms/android/platform_www/cordova.js platforms/android/assets/www
	make after_prepare

emulate :: copy
	cordova emulate ios

before_prepare :: copy
	-mkdir -p platforms/android/res/xml
	rsync -avP ../ios/Default* platforms/ios/*/Resources/splash/

after_prepare :: before_build
	cp MoeDict-Info.plist platforms/ios/MoeDict/MoeDict-Info.plist
	find platforms/android -type f |grep xml$$ | xargs grep -l moe.dict | xargs perl -pi -e 's/moe.dict/dict.moe_c/g'
	#@cd ../android/res && tar cf splash.tar */splash.png && cd ../../cordova/platforms/android/res && tar vxf ../../../../android/res/splash.tar && cd ../../..
	#cp -Rf ../android/res/drawable/* platforms/android/res/drawable
	cp -Rf ./res/icons/android/* platforms/android/res/
	cp -Rf ./res/icons/ios/* platforms/ios/MoeDict/Resources/icons/
	# CSLD Specific
	find platforms -type f -name index.html | xargs perl -pi -e 's!<noscript>!<script>window.STANDALONE="p";</script><noscript>!'
	perl -pi -e 's!href="http[^"]*"!!g' platforms/android/assets/www/about.html
	perl -pi -e 's!<a +target=[^ >]* *>!<a style="color: inherit">!g' platforms/android/assets/www/about.html

before_build ::
	-@mkdir -p platforms/android/src/org/audreyt/dict/moe_c platforms/android/res/menu platforms/android/res/values
	-@rm platforms/android/src/org/audreyt/moe/dict/MoeDict.java
	cp MoeDict.java platforms/android/src/org/audreyt/dict/moe_c
	cp example.xml platforms/android/res/menu/example.xml
	cp strings.xml platforms/android/res/values/strings.xml
	-@cp *.*o* AndroidManifest.xml platforms/android

before_compile :: before_build

after_compile ::
	touch touched

res/icons/android/drawable-hdpi/icon.png :
	cd res/icons && sh convert.sh

platforms/android/bin/MoeDict-debug.apk :
	cordova build android

release :: platforms/android/bin/MoeDict-debug.apk copy after_prepare
	cd platforms/android ; yes $(MOEDICT_PASSWORD) | $(run) ant release

install ::
	-adb uninstall org.audreyt.dict.moe
	adb install -r platforms/android/bin/MoeDict-release.apk

fxos :: copy
	-mkdir platforms/firefoxos
	rsync -av --delete --copy-links base/* platforms/firefoxos
	rsync -av --delete --copy-links ../fxos platforms/firefoxos
	cp cordova-firefoxos.js platforms/firefoxos/cordova.js
	-rm package.zip
	cd platforms/firefoxos && zip -r ../../package.zip * && cd ../..
