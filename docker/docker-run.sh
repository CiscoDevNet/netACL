#! /bin/bash
# docker run -i -h netacl -p 8222:22 -p 8020:8020 -p 9900:9900 -v /tmp:/tmp -t netacl_vm
docker run -i -h netacl -p 8223:22 -p 8023:8020 -p 9900:9900 -t netacl_vm
