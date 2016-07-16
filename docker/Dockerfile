############################################################
# Dockerfile to build netACL
# Based on Ubuntu
############################################################

# Set the base image to Ubuntu
FROM ubuntu:16.04

# File Author / Maintainer
MAINTAINER Niklas Montin

# Set locale
RUN     locale-gen --no-purge en_US.UTF-8
ENV     LC_ALL en_US.UTF-8

# Install dependencies
ENV     DEBIAN_FRONTEND noninteractive


# Update the sources list
RUN apt-get update \
        && apt-get install -y -f \
        software-properties-common \
        tar \
        git \
        curl \
        nano \
        wget \
        vim \
        dialog \
        net-tools \
        build-essential \
        python \
        python-dev \
        python-distribute \
        python-pip \
        python-tornado \
        python-lxml \
        telnet \
        expect \
        sshpass \
        qemu-utils \
        libssl-dev \
        libffi-dev \
        openssh-server \
        openssh-client \
        sudo \
        && pip install requests 

ADD /files /opt/files

RUN tar xvzf /opt/files/sshkeys2.tgz -C /etc/ssh \
        && /opt/files/user_cisco.sh

#
WORKDIR	/opt/files
RUN su -l cisco -c 'git clone https://github.com/CiscoDevNet/netACL' \
    && pip install --upgrade pip \ 
    && pip install -r /home/cisco/netACL/backend/requirements.txt \
    && pip install -r /home/cisco/netACL/frontend/requirements.txt \
    && cp -p /opt/files/backend.sh /home/cisco \
    && cp -p /opt/files/frontend.sh /home/cisco 

ENTRYPOINT /opt/files/start_all.sh && /bin/bash 
