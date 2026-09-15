terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.35"
    }
  }
}

provider "kubernetes" {
  config_path    = "~/.kube/config"
  config_context = "minikube"
}

resource "kubernetes_deployment" "virtual_piano" {
  metadata {
    name = "virtual-piano"

    labels = {
      app = "virtual-piano"
    }
  }

  spec {
    replicas = 2

    selector {
      match_labels = {
        app = "virtual-piano"
      }
    }

    template {
      metadata {
        labels = {
          app = "virtual-piano"
        }
      }

      spec {
        container {
          name  = "virtual-piano"
          image = "virtual-piano:1.0"

          image_pull_policy = "IfNotPresent"

          port {
            container_port = 80
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "virtual_piano" {
  metadata {
    name = "virtual-piano-service"
  }

  spec {
    selector = {
      app = "virtual-piano"
    }

    type = "NodePort"

    port {
      port        = 80
      target_port = 80
      protocol    = "TCP"
    }
  }
}
