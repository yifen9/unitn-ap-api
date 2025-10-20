terraform {
  required_providers {
    cloudflare = { source = "cloudflare/cloudflare" }
  }
}

resource "cloudflare_d1_database" "db" {
  account_id = var.account_id
  name       = var.d1_name

  lifecycle {
    ignore_changes = [read_replication]
  }
}

output "database_id" { value = cloudflare_d1_database.db.id }
