FROM ugnb/ubuntu-cordova-android-build
MAINTAINER audreyt
WORKDIR /
RUN git clone --depth 1 -b amis https://github.com/g0v/moedict-app.git
WORKDIR /moedict-app/platforms/android
RUN perl -pi -e 's/android-20/android-19/' CordovaLib/project.properties
RUN wget audreyt.org/tmp/Socialtext.keystore
RUN mkdir -p /opt/adt
RUN ln -s /android/sdk /opt/adt/
RUN mkdir -p /Users/audreyt/w/moedict-webkit
RUN ln -s /moedict-app /Users/audreyt/w/moedict-webkit/app
RUN ln -s /android/sdk /Users/audreyt/android-sdks
RUN echo 'key.store.password=moedict_amis' >> project.properties
RUN echo 'key.alias.password=moedict_amis' >> project.properties
RUN make