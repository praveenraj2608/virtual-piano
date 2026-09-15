# Virtual Piano Keyboard 🎹

A simple, polished, responsive client-side Virtual Piano Keyboard web application built for a college DevOps assessment.

The application is engineered entirely with vanilla web technologies and client-side audio synthesis, making it completely self-contained, ultra-lightweight, and ready for automated containerization and deployment with Docker, Kubernetes, Jenkins, Terraform, and Ansible.

---

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Features](#2-features)
- [3. Technologies Used](#3-technologies-used)
- [4. Project Structure](#4-project-structure)
- [5. How to Run Locally](#5-how-to-run-locally)
- [6. How to Build Docker Image](#6-how-to-build-docker-image)
- [7. How to Run Docker Container](#7-how-to-run-docker-container)
- [8. Expected Application URL](#8-expected-application-url)
- [9. Future DevOps Deployment Architecture](#9-future-devops-deployment-architecture)
- [10. Key Mappings Reference](#10-key-mappings-reference)

---

## 1. Project Overview

The **Virtual Piano Keyboard** is a lightweight web application allowing users to play musical notes using either mouse/touch clicks or their computer keyboard. 

Key design points:
- **Zero External Dependencies**: No external frameworks (React, Next.js), no Node.js backend, and no external audio files or CDNs are used.
- **Client-Side Synthesis**: Sounds are generated directly in the browser using the native **Web Audio API** with an ADSR envelope (Attack, Decay, Sustain, Release) and multi-oscillator harmonic blending.
- **DevOps-First Design**: The static frontend is built to be served effortlessly by a minimal `nginx:alpine` container (~25 MB image footprint), ideal for fast CI/CD pipeline builds and scalable Kubernetes cluster deployments.

---

## 2. Features

- **Full Playable Octave (Plus High C)**:
  - 8 White Keys: `C`, `D`, `E`, `F`, `G`, `A`, `B`, `C` (octave + 1).
  - 5 Black Keys: `C#`, `D#`, `F#`, `G#`, `A#`.
- **Dual Input Modes**:
  - **Mouse / Touch**: Tap or click any piano key directly. Supports mobile touch devices.
  - **Computer Keyboard**: Play notes in real time using home-row keys (`A`, `S`, `D`, `F`, `G`, `H`, `J`, `K`) and upper-row black keys (`W`, `E`, `T`, `Y`, `U`).
- **Interactive Visual Feedback**:
  - Realistic key-press depth animations and cyan neon glow highlights.
  - Dynamic note display ("Now Playing: C4", "Now Playing: F#4", etc.).
- **Interactive Controls**:
  - **Volume Slider**: Smoothly adjusts master audio volume from 0% to 100%.
  - **Octave Selector**: Shift octaves up or down (Octaves 2 through 6, default 4).
  - **Mute Button**: Instantly mutes and restores sound.
  - **Reset Button**: Restores volume to 75%, octave to 4, un-mutes, and stops active notes.
- **Accessibility**:
  - Semantic HTML5 elements (`<header>`, `<main>`, `<section>`, `<button>`).
  - Clear ARIA labels, role attributes, and visible keyboard focus states.

---

## 3. Technologies Used

- **HTML5**: Semantic document layout, accessible buttons, and control containers.
- **CSS3**: Custom properties (CSS variables), Flexbox, CSS Grid, 3D key elevation effects, glassmorphism, and responsive breakpoints.
- **Vanilla JavaScript (ES6+)**: Event listeners, state management, and polyphonic voice tracking without third-party libraries.
- **Web Audio API**: Real-time programmatic sound synthesis with oscillators (`triangle` and `sine`), gain nodes, and ADSR curves.
- **Nginx (Alpine)**: Production web server delivering static files inside the container.
- **Docker**: Containerization and image packaging.

---

## 4. Project Structure

```text
virtual-piano/
│
├── app/
│   ├── index.html      # Main semantic HTML5 markup & piano structure
│   ├── style.css       # Responsive styling, animations & theme tokens
│   └── script.js       # Web Audio API engine, keyboard events & controls
│
├── Dockerfile          # Nginx Alpine container definition
├── .dockerignore       # Build context exclusion rules
├── README.md           # Project documentation and DevOps roadmap
└── .gitignore          # Git exclusion rules
```

### Explanation of Files:
- **`app/index.html`**: Defines the application layout including the header, status banner, controls toolbar, 13 piano keys (8 white, 5 black) with shortcut badges, and keyboard reference guide.
- **`app/style.css`**: Provides a modern dark studio theme. It uses CSS custom properties to calculate exact proportional positions for black keys, adds realistic depth and active key-press transitions, and guarantees responsiveness on desktop and mobile.
- **`app/script.js`**: Contains the sound synthesis engine using `AudioContext`, calculating exact note frequencies via the standard pitch formula ($A4 = 440\text{ Hz}$). Handles mouse, touch, and keyboard interactions, volume scaling, octave shifts, and reset logic.
- **`Dockerfile`**: Defines a single-stage container build starting from `nginx:alpine`, copying `./app` into `/usr/share/nginx/html` and exposing port 80.
- **`.dockerignore`**: Prevents unnecessary files (Git history, README, editor configs) from being copied into the Docker build context.
- **`.gitignore`**: Prevents operating system caches, editor files, and temporary artifacts from being committed to Git.

---

## 5. How to Run Locally

Because the application is completely client-side, you can run it locally in multiple ways:

### Option A: Open Directly in Browser
Double-click `app/index.html` or open it directly in any modern browser:
```bash
# Windows
start app/index.html

# macOS
open app/index.html

# Linux
xdg-open app/index.html
```

### Option B: Using Python HTTP Server
```bash
# Navigate to the project folder and run:
python -m http.server 8000 --directory app
```
Then visit: `http://localhost:8000`

### Option C: Using Node.js `npx serve` or `http-server`
```bash
npx serve app -p 8000
```
Then visit: `http://localhost:8000`

---

## 6. How to Build Docker Image

Ensure Docker is installed and running, then execute from the root of the project:

```bash
docker build -t virtual-piano:1.0 .
```

This will:
1. Pull the minimal `nginx:alpine` base image.
2. Copy all files from `./app` to `/usr/share/nginx/html`.
3. Expose port `80`.
4. Produce a lightweight production image tagged `virtual-piano:1.0`.

---

## 7. How to Run Docker Container

Run the built image in detached mode, forwarding host port `8080` to container port `80`:

```bash
docker run -d -p 8080:80 --name virtual-piano-app virtual-piano:1.0
```

To stop and remove the container:
```bash
docker stop virtual-piano-app
docker rm virtual-piano-app
```

---

## 8. Expected Application URL

Once the Docker container is running, open your web browser and navigate to:

```text
http://localhost:8080
```

You will see the **Virtual Piano Keyboard** interface ready to play immediately.

---

## 9. Future DevOps Deployment Architecture

In the broader DevOps assessment, this repository serves as the deployable frontend workload across a complete CI/CD and GitOps infrastructure lifecycle.

### High-Level Architecture Flow:

```text
  +------------------+
  |   GitHub Repo    |  <-- Developer pushes code to main / feature branch
  +--------+---------+
           | Webhook Trigger
           v
  +------------------+
  |  Jenkins Server  |  <-- Automates linting, testing, and Docker image build
  +--------+---------+
           | Docker Build & Push
           v
  +------------------+
  | Docker Registry  |  <-- Stores versioned images (e.g., Docker Hub / Harbor)
  +--------+---------+
           | Deployment Trigger
           v
  +-----------------------------------------------------------+
  |  Infrastructure & Configuration Layer                     |
  |                                                           |
  |  +--------------------+        +-----------------------+  |
  |  |  Terraform (IaC)   | -----> |  Ansible (Config)     |  |
  |  |  Provisions VMs /  |        |  Installs Docker,     |  |
  |  |  Cloud K8s cluster |        |  Kubernetes & tooling |  |
  |  +--------------------+        +-----------------------+  |
  +-----------------------------+-----------------------------+
                                | Deploys Workloads
                                v
  +-----------------------------------------------------------+
  |  Minikube / Kubernetes Cluster                            |
  |                                                           |
  |  [ Ingress / NodePort Service : 8080 / 80 ]               |
  |       |                                                   |
  |       +---> [ ReplicaSet / Deployments ]                  |
  |                 +---> [ Pod: virtual-piano (Nginx) ]      |
  |                 +---> [ Pod: virtual-piano (Nginx) ]      |
  +-----------------------------------------------------------+
```

### Stage-by-Stage Breakdown:

1. **GitHub (Source Control)**:
   - Stores the source code, `Dockerfile`, Kubernetes manifests, and Terraform/Ansible configuration files.
   - Pushing code to `main` triggers a GitHub webhook notification to Jenkins.

2. **Jenkins (CI/CD Pipeline)**:
   - Jenkins pulls the latest code from GitHub.
   - Executes validation and static checks (HTML/CSS validation, Dockerfile linting with Hadolint).
   - Builds the Docker image: `docker build -t <registry-user>/virtual-piano:${BUILD_NUMBER} .`.
   - Authenticates and pushes the tagged image to a Docker container registry (e.g., Docker Hub, GitHub Packages, or AWS ECR).
   - Triggers automated deployment to Kubernetes.

3. **Docker (Packaging & Containerization)**:
   - Packages the static application into immutable, portable `nginx:alpine` containers ensuring zero environmental drift between staging and production.

4. **Terraform (Infrastructure as Code - IaC)**:
   - Declaratively provisions the underlying cloud infrastructure or virtual machines (e.g., AWS EC2/EKS, Azure VMs, or DigitalOcean Droplets).
   - Sets up VPCs, security groups, firewall rules, and target nodes for the Kubernetes cluster.

5. **Ansible (Configuration Management)**:
   - Automates the configuration of the provisioned servers.
   - Installs Docker runtime, container management utilities, security patches, and dependencies across all nodes.
   - Prepares worker nodes to join the Kubernetes/Minikube cluster.

6. **Minikube / Kubernetes (Container Orchestration)**:
   - Deploys the application using Kubernetes manifests (`Deployment.yaml` and `Service.yaml`).
   - Ensures high availability through multi-replica pods, automated pod self-healing, rolling updates, and zero-downtime deployments.
   - An Ingress or NodePort Service routes incoming HTTP traffic on port 8080/80 directly to the Virtual Piano pods.

---

## 10. Key Mappings Reference

| Note | Octave Offset | Computer Keyboard Key | Piano Key Type |
| :--- | :---: | :---: | :--- |
| **C**  | +0 | `A` | White Key |
| **C#** | +0 | `W` | Black Key |
| **D**  | +0 | `S` | White Key |
| **D#** | +0 | `E` | Black Key |
| **E**  | +0 | `D` | White Key |
| **F**  | +0 | `F` | White Key |
| **F#** | +0 | `T` | Black Key |
| **G**  | +0 | `G` | White Key |
| **G#** | +0 | `Y` | Black Key |
| **A**  | +0 | `H` | White Key |
| **A#** | +0 | `U` | Black Key |
| **B**  | +0 | `J` | White Key |
| **C**  | +1 | `K` | White Key (Upper Octave) |

---

## License

MIT License. Designed for academic and DevOps assessment purposes.
