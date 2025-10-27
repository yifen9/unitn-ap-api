terraform {
  required_providers { cloudflare = { source = "cloudflare/cloudflare" } }
}

resource "cloudflare_queue" "q" {
  account_id = var.account_id
  queue_name = var.queue_name
}

output "queue_name" { value = cloudflare_queue.q.queue_name }
output "queue_id" { value = cloudflare_queue.q.id }
