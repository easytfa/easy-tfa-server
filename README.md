# EasyTFA Server
This repository contains a [NestJS](https://nestjs.com/) implementation of an EasyTFA relay server, written in Typescript.
It can be used to self-host the server but a free hosted version is available at [https://eu-relay1.easytfa.com](https://eu-relay1.easytfa.com).

## docker-compose setup
The easiest and recommended way to self-host this server is by using the provided docker image `easytfa/easy-tfa-server`.
This documentation uses `docker-compose` to manage docker containers, but feel free to use a different way that suits your setup.

### Prerequisites
To support HTTPS (which is required by EasyTFA), a reverse proxy can be used. If you do not have a reverse proxy
running yet, then you can use the docker-compose file provided below.
It uses [nginx-proxy](https://github.com/nginx-proxy/nginx-proxy) as reverse proxy and automatically requests a 
letsencrypt certificate with [acme-companion](https://github.com/nginx-proxy/acme-companion).
To get started, create a `docker-compose.yml` file in a separate folder with the following content:
> :warning: The docker-compose file instructs docker to expose ports 80 and 443. It also creates a docker network named 
> `proxy` that will be used later. Read the documentation of the docker images linked above for more information and configuration options.

```yaml
# nginx-proxy/docker-compose.yml
version: '3.5'

services:
  nginx-proxy:
    image: nginxproxy/nginx-proxy:alpine
    labels:
      - com.github.jrcs.letsencrypt_nginx_proxy_companion.nginx_proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/tmp/docker.sock:ro
      - nginx_certs:/etc/nginx/certs:ro
      - nginx_dhparams:/etc/nginx/dhparam
      - nginx_vhost:/etc/nginx/vhost.d
      - nginx_html:/usr/share/nginx/html
    networks:
      - proxy

  nginx-proxy-letsencrypt:
    depends_on:
      - nginx-proxy
    image: nginxproxy/acme-companion
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - nginx_certs:/etc/nginx/certs
      - nginx_vhost:/etc/nginx/vhost.d
      - nginx_html:/usr/share/nginx/html
      - le_acme:/etc/acme.sh
    networks:
      - proxy
networks:
  proxy:
    name: proxy
volumes:
  nginx_certs:
  nginx_dhparams:
  nginx_vhost:
  nginx_html:
  le_acme:
```

Then, run
```console
docker-compose up -d
```
to start the nginx reverse proxy.

### Starting the server
The `easy-tfa-server` docker image exposes port `80` and handles all requests and websocket connections.
If the `nginx-proxy` from above is running, then you can specify the `VIRTUAL_HOST` and `LETSENCRYPT_HOST` environment
variables to instruct `nginx-proxy` that `easy-tfa-server` will handle your requests.

To get started, create a `docker-compose.yml` file in a separate folder with the following content. Replace
the domain names with your custom domain.

```yaml
# easytfa/docker-compose.yml
version: '3.5'
services:
  easy-tfa-server:
    image: easytfa/easy-tfa-server:latest # TODO - replace latest with a specific (major) version after the first full release
    restart: unless-stopped
    environment:
      - VIRTUAL_HOST=example.com # TODO - replace this with your domain name
      - LETSENCRYPT_HOST=example.com # TODO - replace this with your domain name
    networks:
      - proxy
networks:
  proxy:
    name: proxy
```

Then, start the server by executing
```console
docker-compose up -d
```

You can check whether the server is running by navigating to `https://example.com/config`, replacing the domain with your custom domain.
If everything is running, you should get a response like this:
```json
{
  "success": true,
  "version": "Some.Server.Version",
  "push": {
    "supported": false,
    "apiKey": "",
    "applicationId": "",
    "projectId": ""
  }
}
```

### Push notifications
EasyTFA uses Firebase to deliver push notifications to mobile devices. To enable push notifications for your own
server, you first have to create a project at [Firebase](https://firebase.google.com/). Then, follow the steps below
to get all needed access keys.

1. On the project overview, add a new Android App to the project
2. As app name, specify `com.beemdevelopment.aegis`
3. Register the App
4. Download the `google-services.json` file and save it for later use
5. Return to the Firebase console
6. Go to the project settings, and select "Service accounts"
7. Click "Generate new private key"
8. Download the `[projectname]-firebase-adminsdk-[...].json` file. You can rename it to `easytfa-firebase-adminsdk.json` for easier use later
9. Copy the `easytfa-firebase-adminsdk.json` file into the folder with the easy-tfa-server `docker-compose.yml` file

Now, extend the `docker-compose.yml` file so that it contains the notification settings as shown below.
Replace the environment variables with the respective values from the `google-services.json` file.

This `docker-compose` file also specifies a `data` volume. The server will use this to store a small file that will
contain a list of all registered notification endpoints. This allows the server to remember which devices should
receive which notifications after a restart.

```yaml
version: '3.5'

services:
  easy-tfa-server:
    image: easytfa/easy-tfa-server:latest # TODO - replace latest with a specific (major) version after the first full release
    restart: unless-stopped
    environment:
      - VIRTUAL_HOST=example.com
      - LETSENCRYPT_HOST=example.com
      - PUSHNOTIFICATIONS_ENABLED=true
      - PUSHNOTIFICATIONS_APIKEY=AIza... # TODO: Replace with client.api_key.current_key from google-services.json
      - PUSHNOTIFICATIONS_APPLICATIONID=1:7820:android:bfa5a... # TODO: Replace with client.client_info.mobilesdk_app_id from google-services.json
      - PUSHNOTIFICATIONS_PROJECTID=easytfa # TODO: Replace with project_info.project_id from google-services.json
    networks:
      - proxy
    volumes:
      - ./easytfa-firebase-adminsdk.json:/app/easytfa-firebase-adminsdk.json:ro
      - data:/app/data

networks:
 proxy:
   name: proxy
volumes:
  data:
```

Then, (re)start the server by running
```console
docker-compose up -d
```
and open `https://example.com/config` (replacing the domain with your domain name) to check whether the server started
with notifications enabled (Note that you might have to hard refresh the page using Ctrl+F5 because otherwise it might be cached).
You can also check the server connection in the EasyTFA browser extension. The response should look like this:
```json
{
  "success": true,
  "version": "Some.Server.Version",
  "push": {
    "supported": true,
    "apiKey": "your-api-key",
    "applicationId": "your-application-id",
    "projectId": "your-project-id"
  }
}
```
