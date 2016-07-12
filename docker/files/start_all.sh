#! /bin/bash
service sshd start 
su -l cisco -c '/home/cisco/frontend.sh > /tmp/frontend.log 2>&1 &'
su -l cisco -c '/home/cisco/backend.sh > /tmp/backend.log 2>&1 &'

