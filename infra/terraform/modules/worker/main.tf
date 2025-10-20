terraform {
  required_providers {
    cloudflare = { source = "cloudflare/cloudflare" }
  }
}

resource "cloudflare_workers_script" "svc" {
  account_id         = var.account_id
  script_name        = var.service_name
  compatibility_date = "2025-10-20"
  content            = <<-EOW
    addEventListener("fetch", (event) => {
      event.respondWith(new Response(JSON.stringify({ ok: true, env: "dev" }), {
        headers: { "content-type": "application/json" }
      }));
    });
  EOW
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
