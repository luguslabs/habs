#!/bin/bash
#prefix output
# setup fd-3 to point to the original stdout
exec 3>&1
# setup fd-4 to point to the original stderr
exec 4>&2
# get the prefix from SUPERVISOR_PROCESS_NAME environement variable
printf -v PREFIX "%-10.10s" ${SUPERVISOR_PROCESS_NAME}
# reassign stdout and stderr to a preprocessed and redirected to the original stdout/stderr (3 and 4) we have create eralier
exec 1> >( perl -ne '$| = 1; print "'"${PREFIX}"' | $_"' >&3)
exec 2> >( perl -ne '$| = 1; print "'"${PREFIX}"' | $_"' >&4)

#unzip config file if exists
if [ ! -z "$CONFIG_FILE" ]; then
    #unpack config file
    if [ -f "/config/archipel-config.zip" ]; then
          echo "Unzip archipel-config.zip file from /config directory."
          #if config file password was set unzip with password
          if [ ! -z "$CONFIG_FILE_PASSWORD" ]; then
                if [ ! -z "$DEBUG" ]; then
                      echo "Unzip if first time with -u option."
                fi
                unzip -u -P "$CONFIG_FILE_PASSWORD" -o /config/archipel-config.zip -d /config
                if [ ! -z "$DEBUG" ]; then
                      echo "Refresh all configs files with unzip -f option."
                fi
                unzip -f -P "$CONFIG_FILE_PASSWORD" -o /config/archipel-config.zip -d /config
          else
                if [ ! -z "$DEBUG" ]; then
                      echo "Unzip if first time  with -u option."
                fi
                unzip -u -o /config/archipel-config.zip -d /config
                if [ ! -z "$DEBUG" ]; then
                      echo "Refresh all configs files with unzip -f option."
                fi
                unzip -f -o /config/archipel-config.zip -d /config
          fi
          CONFIG_FILE_PATH="/config/config.json"
    else
          echo "No config file found in /config/archipel-config.zip"
          exit 1
    fi
fi
# Export env variables
export NODE_ENV=production

# Launching orchestrator
echo "Waiting 5 seconds for Archipel Node to start..."
sleep 5
echo "Launching orchestrator..."
exec node src/app.js