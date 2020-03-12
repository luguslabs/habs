#!/bin/bash
# get container IP from host
ARCHIPEL_CONTAINER_IP=$(awk 'END{print $1}' /etc/hosts)
echo "Valorize __PRODUCTION_PROVIDER_SOCKET__ config with  : ws://$ARCHIPEL_CONTAINER_IP:9944"
sed -i -e "s/__PRODUCTION_PROVIDER_SOCKET__/ws:\/\/$ARCHIPEL_CONTAINER_IP:9944/g" /var/www/html/static/js/*.js 

echo "Launch Ui"
# Launch Ui
exec nginx -g 'daemon off;'
