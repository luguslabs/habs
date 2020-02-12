# WireGuard for Archipel

WireGuard is a free and open-source software application and communication protocol that implements virtual private network techniques to create secure point-to-point connections in routed or bridged configurations. [Wikipedia](https://en.wikipedia.org/wiki/WireGuard) 

To enhance the security of Archipel solution, firstly we need to create a secure communication channel. 

Here you will find a dockerized version of WireGuard inspired from [wireguard-docker](https://github.com/cmulk/wireguard-docker).

**Warning!** You can launch this container only at a Debian system with WireGuard kernel module installed.

To install WireGuard kernel module:
```bash
echo "deb http://deb.debian.org/debian/ unstable main" | sudo tee /etc/apt/sources.list.d/unstable.list
echo -e "Package: *\nPin: release a=unstable\nPin-Priority: 150\n" | tee /etc/apt/preferences.d/limit-unstable
sudo apt update
sudo apt install -y linux-headers-cloud-amd64 linux-headers-amd64 wireguard-dkms
```

### Launching Archipel with WireGuard

#### Example
##### docker-compose.yml
```bash
version: '3.4'
services:
  archipel:
    image: luguslabs/archipel:v0.0.2
    volumes:
      - 'data:/root/chain/data'
      - '/var/run/docker.sock:/var/run/docker.sock'
    env_file:
      - .env
    network_mode: "service:wireguard"
    restart: always

  wireguard:
    image: luguslabs/wireguard
    privileged: true
    env_file:
      - .env
    ports:
      - '51820:51820/udp'
    restart: always

volumes:
  data: {} 
```

##### Add WireGuard configuration to .env file
```bash
# WireGuard Configuration
WIREGUARD_PRIVATE_KEY=SNLJW
WIREGUARD_ADDRESS=10.0.1.1/32
WIREGUARD_LISTEN_PORT=51820
WIREGUARD_PEERS_PUB_ADDR=xmF,xg3wSES,gMjvfQ
WIREGUARD_PEERS_ALLOWED_IP=10.0.1.1/32,10.0.1.2/32,10.0.1.3/32
WIREGUARD_PEERS_EXTERNAL_ADDR=<public_ip_peer1>:51820,<public_ip_peer2>:51820,<public_ip_peer3>:51820
```

* All traffic from Archipel service will be routed to WireGuard service. So Archipel will be able to access to WireGuard private network.
  * ``` network_mode: "service:wireguard" ```
