# Docker Build & Run Guide

This guide explains how to build the Django Docker image for the gPBL Judge Engine and how to properly run the container so that it functions correctly.

## 1. Build the Docker Image

To build the Docker image, run the following command from the root directory of the project (where the `Dockerfile` is located):

```bash
docker build -t gpbl-judge-engine .
```

* `gpbl-judge-engine` is the tag (name) given to the image.
* `.` specifies that the build context is the current directory.

## 2. Run the Docker Container

The gPBL application requires access to the host's Docker daemon because the **Judge Engine dynamically spawns isolated containers** to safely execute untrusted user code submissions. 

To grant the Django container this access, you **must mount the Docker socket** (`/var/run/docker.sock`) from your host machine to the container.

Run the following command to start the server:

```bash
docker run -d \
    --name gpbl_server \
    -p 8000:8000 \
    -v /var/run/docker.sock:/var/run/docker.sock \
    gpbl-judge-engine
```

### Breakdown of the flags:
- `-d`: Runs the container in detached mode (in the background).
- `--name gpbl_server`: Assigns the name `gpbl_server` to your running container.
- `-p 8000:8000`: Maps port 8000 on your host machine to port 8000 inside the container.
- `-v /var/run/docker.sock:/var/run/docker.sock`: **(CRITICAL)** Mounts the host's Docker socket into the container so the Python `docker` SDK inside Django can orchestrate new containers for code execution.

## 3. Environment Variables (Optional but Recommended)

If your database is hosted elsewhere or you want to override default settings, you should pass environment variables to the container. The best way to do this is using an `.env` file.

Assuming you have a `.env` file in your root folder:

```bash
docker run -d \
    --name gpbl_server \
    -p 8000:8000 \
    --env-file .env \
    -v /var/run/docker.sock:/var/run/docker.sock \
    gpbl-judge-engine
```

## 4. Useful Commands

- **View Logs:**
  ```bash
  docker logs -f gpbl_server
  ```
- **Stop the container:**
  ```bash
  docker stop gpbl_server
  ```
- **Start an already created container:**
  ```bash
  docker start gpbl_server
  ```
- **Run migrations inside the running container:**
  ```bash
  docker exec -it gpbl_server python manage.py migrate
  ```
