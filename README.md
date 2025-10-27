[![Image Dev](https://github.com/unitn-ap-2025/api/actions/workflows/image-dev.yaml/badge.svg)](https://github.com/unitn-ap-2025/api/actions/workflows/image-dev.yaml) [![Docs](https://github.com/unitn-ap-2025/api/actions/workflows/docs.yaml/badge.svg)](https://github.com/unitn-ap-2025/api/actions/workflows/docs.yaml)

# API

## Introduction

This repo is for backend usage, providing APIs for the org ([unitn-ap-2025](https://github.com/unitn-ap-2025)).

The stack is so-called "serverless", based on CloudFlare + Hono.

The domain for the API is [api.ap.unitn.yifen9.li](https://api.ap.unitn.yifen9.li), maintained by [Li Yifeng](https://yifen9.li) ([yifen9](https://github.com/yifen9)).

More info: [unitn-ap-2025.github.io/api](https://unitn-ap-2025.github.io/api).

## Implementation

### Inviter

This is an auto inviter to invite members into this org, and to settle them teams automatically.

To be specific, for example, if you are a team leader of team "Test", then you would be invited into a team called "leader" and a team called "wg-test". In another case, a normal member of "Test" would be invited into team "member" and team "wg-test".

For the complete roster, please check [/config/roster.json](https://github.com/unitn-ap-2025/api/blob/main/config/roster.json).

>WARNING: Because the prof disabled copy & paste in the Telegram Group, I can only type in the roster manually by vibing and there might be a mistake, so I would recommend you to check the [/config/roster.json](https://github.com/unitn-ap-2025/api/blob/main/config/roster.json) first to make sure.

#### Usage

##### Via Scripts (Easy Mode)

1. Depending on your OS (.sh for Linux and .cmd for Windows), download the inviter script (found in [/ops/scripts](https://github.com/unitn-ap-2025/api/blob/main/ops/scripts)) and run it. It requires you to have [curl](https://curl.se) and [jq](https://jqlang.org) (and normally they are installed by default or just too commonly used).
2. Follow the instructions the script provides you. It would require your GitHub ID and your E-mail address (@studenti.unitn.it), and send you a link.
3. Check the inbox of your E-mail, potentially in the "spam" folder, you should be able to find an E-mail from "no-reply@yifen9.li" titled "UniTN AP 2025".
4. Click the link showed on that E-mail, and you should see a JSON message saying that your request has been queued.
5. Wait for a notification pop-up in your GitHub inbox and accept the invitation.

##### Via curl (Hard Mode)

You should be able to figure it out by yourself using [the OpenAPI documents](https://unitn-ap-2025.github.io/api).

## Contribution

This repo is currently maintained by [Li Yifeng](https://yifen9.li) ([yifen9](https://github.com/yifen9)).

For developing, VSCode with devcontainer is recommended.

If the devcontainer doesn't work, try to add a file ".dev.env" in /.devcontainer and try again.
