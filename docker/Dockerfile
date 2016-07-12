############################################################
# Dockerfile to build:
# BGP-Pathman App server
# Based on CentOS
############################################################

# Set the base image to CentOS
FROM centos:centos6.6

# File Author / Maintainer
MAINTAINER Niklas Montin

# Set locale
ENV     LC_ALL en_US.UTF-8

# Install dependencies
ENV     DEBIAN_FRONTEND noninteractive

# set baseurl for yum
RUN sed -i "s/#baseurl/baseurl/g" /etc/yum.repos.d/CentOS-Base.repo
    #&& cp /opt/files/dc.repo /etc/yum.repos.d

# Install packages
RUN yum -y update \
        && yum -y install \
        xz \
        passwd \
        git \
        tar \
        wget \
        telnet \
        curl \
        dialog \
        net-tools \
        which \
        vim \
        make \
        gcc \
        gcc-++ \
        python-tornado \
        python-requests \
        groupinstall \
        development \
        zlib-dev \
        openssl-devel \
        sqlite-devel \
        bzip2-devel \
        openssh-server \
        openssh-client \
        sudo

ADD /files /opt/files

RUN /opt/files/python_install.sh

RUN /opt/files/user_cisco.sh


# Set the default directory where CMD will execute
WORKDIR    /opt
RUN su -l cisco -c 'git clone https://github.com/CiscoDevNet/netACL' \
    && pip2.7 install -r /home/cisco/netACL/backend/requirements.txt \
    && pip2.7 install -r /home/cisco/netACL/frontend/requirements.txt \
    && cp -p /opt/files/backend.sh /home/cisco \
    && cp -p /opt/files/frontend.sh /home/cisco

ENTRYPOINT /opt/files/start_all.sh && /bin/bash
