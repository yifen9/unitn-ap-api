terraform {
  required_providers { cloudflare = { source = "cloudflare/cloudflare" } }
}

locals {
  build_dir      = "${abspath(path.root)}/build"
  module_file    = fileexists("${local.build_dir}/_worker.js") ? "_worker.js" : "index.js"
  module_content = file("${local.build_dir}/${local.module_file}")
}

resource "cloudflare_workers_script" "svc" {
  account_id         = var.account_id
  script_name        = var.service_name
  compatibility_date = var.compatibility_date
  main_module        = local.module_file
  content            = trimspace(local.module_content)

  bindings = [
    {
      name = "DB"
      type = "d1"
      id   = var.d1_database_id
    },
    {
      name         = "KV"
      type         = "kv_namespace"
      namespace_id = var.kv_namespace_id
    },
    {
      name       = "INVITE_JOBS"
      type       = "queue"
      queue_name = var.queue_name
    },
    {
      name = "BASE_URL"
      type = "plain_text"
      text = var.base_url
    },
    {
      name = "GITHUB_ORG"
      type = "plain_text"
      text = var.github_org
    },
    {
      name = "RESEND_API_KEY"
      type = "secret_text"
      text = var.resend_api_key
    },
    {
      name = "EMAIL_TOKEN_SECRET"
      type = "secret_text"
      text = var.email_token_secret
    },
    {
      name = "RESEND_FROM"
      type = "plain_text"
      text = var.resend_from
    },
    {
      name = "GITHUB_TOKEN"
      type = "secret_text"
      text = var.github_token
    },
    {
      name = "GITHUB_WEBHOOK_SECRET"
      type = "secret_text"
      text = var.github_webhook_secret
    }
  ]
}

resource "cloudflare_workers_custom_domain" "domain" {
  account_id  = var.account_id
  zone_id     = var.zone_id
  service     = cloudflare_workers_script.svc.script_name
  hostname    = var.hostname
  environment = "production"
}

output "service_name" { value = cloudflare_workers_script.svc.script_name }
output "hostname" { value = cloudflare_workers_custom_domain.domain.hostname }
