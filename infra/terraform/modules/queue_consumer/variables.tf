variable "account_id" { type = string }
variable "queue_id" { type = string }
variable "script_name" { type = string }

variable "batch_size" {
  type    = number
  default = 10
}
variable "max_wait_time_ms" {
  type    = number
  default = 5000
}
variable "max_retries" {
  type    = number
  default = 5
}
variable "retry_delay" {
  type    = number
  default = 10
}
variable "max_concurrency" {
  type    = number
  default = null
}
