#!/data/data/com.termux/files/usr/bin/bash
set -e
pkg update -y
pkg upgrade -y
pkg install nodejs-lts git python nano unzip -y
echo "Termux dependencies installed. Next: configure PostgreSQL (local or hosted) and backend/.env."
