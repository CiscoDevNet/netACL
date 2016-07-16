# Running netACL inside a Docker container.

Updated 20160715

Here is a Dockerfile example for how to build a container that runs this app.

Uses Ubuntu 16.04

## Overview of Files

| Filename        | Purpose                            | Comments                   |
|-----------------|------------------------------------|----------------------------|
| Dockerfile      | The build recipe                   | Installs more than you need
| docker_build.sh | Builds the container               |
| docker_run.sh   | Starts the container and map ports | mapping

Supporting files in ./files:

| Filename        | Purpose                            | Comments                   |
|-----------------|------------------------------------|----------------------------|
| user_cisco.sh | Adds a user cisco          | Used for demo purposes
| frontend.sh   | Starts the UI service |
| backend.sh    | Starts the backend service |
| start_all.sh  | Starts sshd, frontend and backend | You don't *need* sshd running

**Note:** Having either sshd running, or mapping /tmp:/tmp is useful for debugging.

## How To Build the Container

```
./docker-build.sh
```


## How to Run the Container

```
./docker-run.sh
```


## How to pull from Docker Hub
The netACL APP is also avilable at <https://hub.docker.com/r/nikmon2/pathman_sr>

```
docker pull nikmon2/pathman_sr
```

### How to Run
```
docker run -d -h netacl -p 8223:22 -p 8023:8020 -p 9900:9900 -t nikmon2/netacl

```
**Note:** The above run command puts sshd at port 8223 and the app url now needs to say 8023 instead of 8020.

