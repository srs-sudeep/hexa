#!/bin/bash

# Create certificates directory
mkdir -p certs

# Generate private key
openssl genrsa -out certs/key.pem 2048

# Generate certificate
openssl req -new -x509 -key certs/key.pem -out certs/cert.pem -days 365 -subj "/CN=localhost"

echo "SSL certificates generated in certs/ directory"
echo "You can now use HTTPS with your development server"
