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
    volumes:
      - '/etc/wireguard:/etc/wireguard'
    ports:
      - '51820:51820/udp'
    restart: always

volumes:
  data: {} 
```

* All traffic from Archipel service will be routed to WireGuard service. So Archipel will be able to access to WireGuard private network.
  * ``` network_mode: "service:wireguard" ```

#### Example of WireGuard configuration

```bash
[Interface]
Address = 10.0.1.1/24
PrivateKey = SNLJW...
ListenPort = 51820

[Peer]
PublicKey = xg3wSES...
AllowedIPs = 10.0.2.0/24
Endpoint = <public_ip>:51820

[Peer]
PublicKey = gMjvfQ...
AllowedIPs = 10.0.3.0/24
Endpoint = <public_ip>:51820
```

