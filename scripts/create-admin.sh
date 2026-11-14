#!/data/data/com.termux/files/usr/bin/bash
set -e
read -p "Admin name: " NAME
read -p "Admin email: " EMAIL
read -s -p "Password (minimum 8 chars): " PASSWORD
echo
curl -sS -X POST http://127.0.0.1:4000/api/v1/auth/register \
 -H 'Content-Type: application/json' \
 -d "{\"name\":\"$NAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
echo
