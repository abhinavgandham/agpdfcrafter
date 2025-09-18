#!/bin/bash
# Update and install Docker + Docker Compose
sudo apt-get update -y
sudo apt-get install -y docker.io docker-compose

# Start Docker and enable on boot
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Login to ECR
sudo aws ecr get-login-password --region ap-southeast-2   | sudo docker login --username AWS --password-stdin 901444280953.dkr.ecr.ap-southeast-2.amazonaws.com

# Run Docker Compose
docker-compose up