all :: bin/MoeActivity-release.apk

run = env LC_ALL=C ANDROID_HOME=/opt/adt/sdk

bin/MoeActivity-release.apk ::
	cp -av ../../www/ assets/
	grep CordovaLib project.properties || (echo 'android.library.reference.1=CordovaLib' >> project.properties)
	$(run) ant release

run ::
	cd assets/www && node ../../static-here.js

clean ::
	ant clean

install ::
	adb install -r bin/MoeDict-release.apk

upload ::
	rsync -avzP bin/MoeDict-release.apk audreyt.org:public_html/newdict/Moe1.apk
