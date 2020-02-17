# Archipel Deployer
Archipel End-To-End tests, build scripts and deploy tools.

## Building Docker images
### Archipel
```bash
# Clone the repository
git clone https://github.com/luguslabs/archipel.git
docker build -t luguslabs/archipel . -f deployer/archipel-docker/Dockerfile
```

### Archipel Node
```bash
# Clone the repository
git clone https://github.com/luguslabs/archipel.git
docker build -t luguslabs/archipel-node . -f deployer/archipel-node-docker/Dockerfile
```

### Archipel wire WireGuard VPN
```bash
# Clone the repository
git clone https://github.com/luguslabs/archipel.git
docker build -t luguslabs/archipel-with-wireguard . -f deployer/archipel-with-wireguard/Dockerfile
```
