output "service_name" {
  value = kubernetes_service.virtual_piano.metadata[0].name
}

output "service_port" {
  value = kubernetes_service.virtual_piano.spec[0].port[0].node_port
}
