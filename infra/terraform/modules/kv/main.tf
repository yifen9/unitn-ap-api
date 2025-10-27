terraform {
  required_providers { cloudflare = { source = "cloudflare/cloudflare" } }
}

resource "cloudflare_workers_kv_namespace" "kv" {
  account_id = var.account_id
  title      = var.title
}

output "namespace_id" { value = cloudflare_workers_kv_namespace.kv.id }
