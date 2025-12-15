#!/bin/bash

PORT=3000

while getopts "p:" opt; do
  case $opt in
    p) PORT="$OPTARG";;
    *) echo "Uso: $0 [-p porta]"; exit 1;;
  esac
done

echo "Matando processos existentes..."
pkill -f "vite" 2>/dev/null
pkill -f "node.*dev" 2>/dev/null
pkill -f "esbuild" 2>/dev/null
lsof -ti:$PORT | xargs kill -9 2>/dev/null

sleep 1

echo "Iniciando servidor na porta $PORT..."
npm run dev -- --port $PORT
