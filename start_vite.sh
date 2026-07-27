#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd "/mnt/d/a.midnight/Private Voting System/private-voting-system"
npm install

cd "/mnt/d/a.midnight/Private Voting System/private-voting-system/voting-ui"
npm run dev
