#!/bin/bash
# get container IP from host
ARCHIPEL_CONTAINER_IP=$(awk 'END{print $1}' /etc/hosts)
echo "Valorize __PRODUCTION_PROVIDER_SOCKET__ config with  : ws://$ARCHIPEL_CONTAINER_IP:9944"
sed -i -e "s/__PRODUCTION_PROVIDER_SOCKET__/ws:\/\/$ARCHIPEL_CONTAINER_IP:9944/g" /var/www/html/static/js/*.js 

# UI link can be download with DappNNode File Manager interface
echo "Generate link UI file in /config/UILink.txt with content : http://$ARCHIPEL_CONTAINER_IP"
mkdir -p /config
echo "http://$ARCHIPEL_CONTAINER_IP" > /config/UILink.txt

echo "Launch Ui"
# Launch Ui
exec nginx -g 'daemon off;'
