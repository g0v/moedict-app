all :: bin/MoeActivity-release.apk

run = env LC_ALL=C ANDROID_HOME=/opt/adt/sdk

bin/MoeActivity-release.apk ::
	grep CordovaLib project.properties || (echo 'android.library.reference.1=CordovaLib' >> project.properties)
	yes $(MOEDICT_PASSWORD) | $(run) ant release

clean ::
	ant clean

install ::
	adb install -r bin/MoeDict-release.apk

upload ::
	rsync -avzP bin/MoeDict-release.apk audreyt.org:public_html/newdict/Moe1.apk
