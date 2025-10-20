# syntax=docker/dockerfile
FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive LANG=C.UTF-8 LC_ALL=C.UTF-8
WORKDIR /workspace

ARG APT_PROFILES="base common"
COPY ops/apt /ops/apt
RUN find /ops/apt -type f -name '*.txt' -exec sed -i 's/\r$//' {} + && for f in $(echo $APT_PROFILES | tr ' ' '\n' | sed 's|^|/ops/apt/|;s|$|.txt|'); do test -f "$f" && cat "$f"; done | awk '{sub(/#.*/,""); print}' | sed '/^\s*$/d' | sort -u > /ops/all.txt
RUN apt-get update && xargs -r -a /ops/all.txt apt-get install -y --no-install-recommends && rm -rf /var/lib/apt/lists/*

ARG NVM_VERSION=v0.40.3
ARG PNPM_VERSION=10.18.3
ENV NVM_DIR=/opt/nvm
RUN mkdir -p $NVM_DIR
RUN curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh | bash
RUN bash -lc "source $NVM_DIR/nvm.sh && nvm install --lts && nvm alias default 'lts/*' && node -v && npm -v"
RUN bash -lc "corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate && pnpm -v"

RUN wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" > /etc/apt/sources.list.d/hashicorp.list && \
    apt-get update && apt-get install -y --no-install-recommends terraform && \
    rm -rf /var/lib/apt/lists/*

RUN git config --system --add safe.directory /workspace
CMD ["bash","-lc","exec sleep infinity"]
