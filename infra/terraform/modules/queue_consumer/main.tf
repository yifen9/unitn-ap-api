terraform {
  required_providers { cloudflare = { source = "cloudflare/cloudflare" } }
}

resource "cloudflare_queue_consumer" "consumer" {
  account_id  = var.account_id
  queue_id    = var.queue_id
  script_name = var.script_name

  settings = {
    batch_size       = var.batch_size
    max_wait_time_ms = var.max_wait_time_ms
    max_retries      = var.max_retries
    retry_delay      = var.retry_delay
    max_concurrency  = var.max_concurrency
  }
}
