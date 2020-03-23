#!/bin/sh

# check env file prepared and coming from Archipel DappNodePackage shared volume
if [ -f /config/archipel-ui.env ]
then
    echo "load env /config/archipel-ui.env"
    . /config/archipel-ui.env
fi
# if REACT_APP_API_URL env set, valorize static js files
if [ ! -z "$REACT_APP_API_URL" ]
then
    echo "REACT_APP_API_URL env is : $REACT_APP_API_URL"
    echo "Valorize API_URL in static js files from REACT_APP_API_URL env"
    sed -i -e 's~\({\"API_URL\":\"\)\(.*:3000\)\(\"}\)~\1'$REACT_APP_API_URL'\3\4~g' /usr/share/nginx/html/static/js/*.js
else
    echo " REACT_APP_API_URL env var not found. Do nothing and use default value in config/production.json"
fi

ARCHIPEL_UI_CONTAINER_IP=$(awk 'END{print $1}' /etc/hosts)
echo "Archipel UI website go to : http://$ARCHIPEL_UI_CONTAINER_IP"
exec nginx -g 'daemon off;'