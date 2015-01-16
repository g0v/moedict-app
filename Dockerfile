# 
# Dockerfile to build miaoski/moedict_amis:0.1
#
FROM peernohell/cordova
MAINTAINER miaoski
 
RUN apt-get update
 
RUN apt-get install -y git
RUN apt-get install -y tree
RUN apt-get install -y vim
RUN apt-get install -y screen
 
RUN apt-get install -y curl
RUN apt-get install -y build-essential
RUN apt-get install -y g++

RUN npm install -g LiveScript

# Copy script to build from GitHub
ADD build-moedict-amis.sh /usr/local/src/
WORKDIR /usr/local/src
