data "cloudflare_zones" "z" {
  name = var.zone_name
}

module "db" {
  source     = "./modules/d1"
  account_id = var.account_id
  d1_name    = var.d1_name
}

module "worker" {
  source       = "./modules/worker"
  account_id   = var.account_id
  service_name = "unitn-ap-api-dev"
  hostname     = "dev.api.ap.unitn.yifen9.li"
  zone_id      = data.cloudflare_zones.z.result[0].id
  env          = "production"
  depends_on   = [module.db]
}

output "dev_hostname" { value = module.worker.hostname }
output "d1_database_id" { value = module.db.database_id }
