data "cloudflare_zones" "z" {
  name = var.zone_name
}

module "db" {
  source     = "./modules/d1"
  account_id = var.account_id
  d1_name    = var.d1_name
}

module "kv" {
  source     = "./modules/kv"
  account_id = var.account_id
  title      = var.kv_namespace
}

module "queue" {
  source     = "./modules/queues"
  account_id = var.account_id
  queue_name = var.queue_name
}

module "worker" {
  source             = "./modules/worker"
  account_id         = var.account_id
  zone_id            = data.cloudflare_zones.z.result[0].id
  service_name       = var.service_name
  hostname           = var.hostname
  compatibility_date = var.compatibility_date

  d1_database_id  = module.db.database_id
  kv_namespace_id = module.kv.namespace_id
  queue_id        = module.queue.queue_id
  queue_name      = module.queue.queue_name

  base_url   = var.base_url
  github_org = var.github_org

  resend_api_key        = var.resend_api_key
  email_token_secret    = var.email_token_secret
  github_token          = var.github_token
  github_webhook_secret = var.github_webhook_secret
}

output "dev_hostname" { value = module.worker.hostname }
output "service_name" { value = module.worker.service_name }
output "d1_database_id" { value = module.db.database_id }
output "d1_name" { value = var.d1_name }
output "compatibility_date" { value = var.compatibility_date }
