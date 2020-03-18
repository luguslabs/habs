# Archipel Deployer
Archipel End-To-End tests, build scripts and deploy tools.

## Building Docker images
### Archipel
```bash
# Clone the repository
git clone https://github.com/luguslabs/archipel.git
docker build -t luguslabs/archipel . -f deployer/archipel/Dockerfile
```

### Create Archipel Test version
```bash
# Clone the repository
git clone https://github.com/luguslabs/archipel.git
docker build -t luguslabs/archipel:test . -f deployer/archipel/Dockerfile
```
