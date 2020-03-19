#!/bin/bash
# get container IP from host
ARCHIPEL_CONTAINER_IP=$(awk 'END{print $1}' /etc/hosts)
echo "Valorize __PRODUCTION_API_URL__ config with  : http://$ARCHIPEL_CONTAINER_IP"
sed -i -e "s/__PRODUCTION_API_URL__/http:\/\/$ARCHIPEL_CONTAINER_IP/g" /var/www/html/static/js/*.js 

# UI link can be download with DappNNode File Manager interface
echo "Generate link UI file in /config/UILink.txt with content : http://$ARCHIPEL_CONTAINER_IP"
mkdir -p /config
echo "http://$ARCHIPEL_CONTAINER_IP" > /config/UILink.txt

echo "Launch Ui"
# Launch Ui
exec nginx -g 'daemon off;'
