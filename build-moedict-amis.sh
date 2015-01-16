#!/bin/bash
cd /usr/local/src
git clone https://github.com/audreyt/moedict-webkit.git
cd moedict-webkit
git checkout amis-react
npm install webworker-threads
make amis
git clone https://github.com/g0v/moedict-app.git
cd moedict-app
git checkout amis
make
cordova build android
