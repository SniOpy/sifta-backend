#!/bin/bash

# Script pour charger nvm et utiliser la version spécifiée dans .nvmrc
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Charger la version depuis .nvmrc si elle existe
if [ -f .nvmrc ]; then
  nvm use
fi

# Exécuter la commande passée en argument
exec "$@"
