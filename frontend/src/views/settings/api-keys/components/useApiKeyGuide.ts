import { ref } from "vue";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ImplGuideTab =
  | "install"
  | "env"
  | "binary"
  | "dockercli"
  | "docker"
  | "k8s"
  | "k8s-manifest"
  | "helm";

export type InstallPlatform = "deb" | "rpm" | "tar" | "win" | "mac" | "docker";

// ─── Service Versions ─────────────────────────────────────────────────────────
export const TFO_AGENT_VERSION     = "1.2.0";
export const TFO_COLLECTOR_VERSION = "1.2.1";

export type KeyParams = {
  rawApiKeyId?: string;
  rawApiKeySecret: string;
  rawEncryptKey: string;
  apiKeyId?: string;
};

// ─── Tab / platform configs ───────────────────────────────────────────────────

export const guideTabs = [
  { label: "Installation",   value: "install"      as const, icon: "carbon:download"    },
  { label: ".env",           value: "env"          as const, icon: "carbon:document"    },
  { label: "Binary Run",     value: "binary"       as const, icon: "carbon:terminal"    },
  { label: "Docker CLI",     value: "dockercli"    as const, icon: "logos:docker-icon"  },
  { label: "docker-compose", value: "docker"       as const, icon: "logos:docker-icon"  },
  { label: "Kubernetes",     value: "k8s"          as const, icon: "logos:kubernetes"   },
  { label: "K8S Manifest",   value: "k8s-manifest" as const, icon: "logos:kubernetes"   },
  { label: "Helm",           value: "helm"         as const, icon: "logos:helm"         },
];

export const installPlatformOptions = [
  { label: "Debian / Ubuntu  (.deb)",        value: "deb"    },
  { label: "RHEL / CentOS / Fedora  (.rpm)", value: "rpm"    },
  { label: "Linux  (tar.gz)",                value: "tar"    },
  { label: "Windows  (.zip)",                value: "win"    },
  { label: "macOS  (.dmg / tar.gz)",         value: "mac"    },
  { label: "Docker",                         value: "docker" },
];

// ─── HTML escape ──────────────────────────────────────────────────────────────

export function _esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ─── Syntax highlighters ──────────────────────────────────────────────────────

export function _hlBash(line: string): string {
  if (!line.trim()) return line;
  if (line.trim().startsWith("#"))
    return `<span class="hl-comment">${line}</span>`;
  return (
    line
      .replace(
        /(["'])(?:(?!\1)[^\\]|\\.)*?\1/g,
        (m) => `<span class="hl-string">${m}</span>`,
      )
      .replace(
        /\b([A-Z_][A-Z0-9_]*)(?==)/g,
        (m) => `<span class="hl-envkey">${m}</span>`,
      )
      .replace(
        /\b(sudo|curl|tar|cd|export|docker|kubectl|dpkg|rpm|systemctl|tee|mv|chmod|apt|mkdir|cp|helm|Invoke-WebRequest|Expand-Archive|Set-Variable)\b/g,
        (m) => `<span class="hl-keyword">${m}</span>`,
      )
      .replace(/((?:^|\s)(--?[a-zA-Z][-a-zA-Z0-9]*))/g, (_, full, flag) =>
        full.replace(flag, `<span class="hl-flag">${flag}</span>`),
      )
      .replace(/(\\)$/g, '<span class="hl-op">\\</span>')
  );
}

export function _hlYaml(line: string): string {
  if (!line.trim()) return line;
  if (line.trim().startsWith("#"))
    return `<span class="hl-comment">${line}</span>`;
  if (line.trim() === "---")
    return `<span class="hl-comment">${line}</span>`;
  const kv = line.match(/^(\s*)([\w.\-/]+)(\s*:\s*)(.*)$/);
  if (kv) {
    const [, indent, key, sep, val] = kv;
    const valHtml = val ? `<span class="hl-string">${val}</span>` : "";
    return `${indent}<span class="hl-yamlkey">${key}</span>${sep}${valHtml}`;
  }
  const li = line.match(/^(\s*-\s+)(.*)$/);
  if (li) return `${li[1]}<span class="hl-string">${li[2]}</span>`;
  return line;
}

export function _hlEnv(line: string): string {
  if (!line.trim()) return line;
  if (line.trim().startsWith("#"))
    return `<span class="hl-comment">${line}</span>`;
  const m = line.match(/^([A-Z_][A-Z0-9_]*)(\s*=\s*)(.*)$/);
  if (m)
    return `<span class="hl-envkey">${m[1]}</span>${m[2]}<span class="hl-string">${m[3]}</span>`;
  return line;
}

// ─── Core code block renderer ─────────────────────────────────────────────────

export function codeBlock(
  code: string,
  lang: "bash" | "yaml" | "env" = "bash",
): string {
  const lines = code.split("\n");
  const hl = lang === "yaml" ? _hlYaml : lang === "env" ? _hlEnv : _hlBash;
  const nums = lines.map((_, i) => `<span>${i + 1}</span>`).join("");
  const content = lines.map((line) => hl(_esc(line))).join("\n");
  return `<div class="gcb-wrap"><div class="gcb-gutter">${nums}</div><pre class="gcb-code">${content}</pre></div>`;
}

// Strips HTML tags + decodes entities — used to get plain text for clipboard
export function rawOf(html: string): string {
  const m = html.match(/<pre class="gcb-code">([\s\S]*?)<\/pre>/);
  const inner = m ? m[1] : html;

  const container = document.createElement("div");
  container.innerHTML = inner;
  return container.textContent ?? "";
}

// ─── Code generators ──────────────────────────────────────────────────────────

export function installCode(
  platform: InstallPlatform,
  service: "agent" | "collector",
  keys: KeyParams,
): string {
  const id  = keys.rawApiKeyId ?? keys.apiKeyId ?? "";
  const sec = keys.rawApiKeySecret;
  const enc = keys.rawEncryptKey;
  const isAgent = service === "agent";
  const ver    = isAgent ? TFO_AGENT_VERSION : TFO_COLLECTOR_VERSION;
  const svc    = isAgent ? "tfo-agent" : "tfo-collector";
  const endVar = isAgent ? "TELEMETRYFLOW_API_ENDPOINT" : "TELEMETRYFLOW_ENDPOINT";
  const ghBase = `https://github.com/telemetryflow/telemetryflow-${service}/releases/download/v${ver}`;
  let code = "";
  if (platform === "deb") {
    const arch    = `${svc}_${ver}_amd64.deb`;
    const archAlt = `${svc}_${ver}_arm64.deb`;
    code = `# Download — arm64: ${archAlt}\ncurl -LO ${ghBase}/${arch}\nsudo dpkg -i ${arch}\n\nsudo tee /etc/${svc}/${svc}.env > /dev/null <<EOF\nTELEMETRYFLOW_API_KEY_ID=${id}\nTELEMETRYFLOW_API_KEY_SECRET=${sec}\nENCRYPTION_KEY=${enc}\n${endVar}=http://<platform-host>:3100\nEOF\n\nsudo systemctl enable --now ${svc}`;
  } else if (platform === "rpm") {
    const arch    = `${svc}-${ver}-1.x86_64.rpm`;
    const archAlt = `${svc}-${ver}-1.aarch64.rpm`;
    code = `# Download — aarch64: ${archAlt}\ncurl -LO ${ghBase}/${arch}\nsudo rpm -i ${arch}\n\nsudo tee /etc/${svc}/${svc}.env > /dev/null <<EOF\nTELEMETRYFLOW_API_KEY_ID=${id}\nTELEMETRYFLOW_API_KEY_SECRET=${sec}\nENCRYPTION_KEY=${enc}\n${endVar}=http://<platform-host>:3100\nEOF\n\nsudo systemctl enable --now ${svc}`;
  } else if (platform === "tar") {
    const arch    = `${svc}_${ver}_linux_amd64.tar.gz`;
    const archAlt = `${svc}_${ver}_linux_arm64.tar.gz`;
    code = `# Download — arm64: ${archAlt}\ncurl -LO ${ghBase}/${arch}\ntar -xzf ${arch}\nsudo mv ${svc} /usr/local/bin/${svc} && sudo chmod +x /usr/local/bin/${svc}\n\n# Run with credentials\nTELEMETRYFLOW_API_KEY_ID="${id}" \\\nTELEMETRYFLOW_API_KEY_SECRET="${sec}" \\\nENCRYPTION_KEY="${enc}" \\\n${endVar}="http://<platform-host>:3100" \\\n${svc} start`;
  } else if (platform === "win") {
    const zip = `${svc}_${ver}_windows_amd64.zip`;
    const dir = isAgent ? "TFO-Agent" : "TFO-Collector";
    code = `$url = "${ghBase}/${zip}"\nInvoke-WebRequest -Uri $url -OutFile ${svc}.zip\nExpand-Archive ${svc}.zip -DestinationPath "C:\\Program Files\\${dir}" -Force\n\n[System.Environment]::SetEnvironmentVariable("TELEMETRYFLOW_API_KEY_ID","${id}","Machine")\n[System.Environment]::SetEnvironmentVariable("TELEMETRYFLOW_API_KEY_SECRET","${sec}","Machine")\n[System.Environment]::SetEnvironmentVariable("ENCRYPTION_KEY","${enc}","Machine")\n[System.Environment]::SetEnvironmentVariable("${endVar}","http://<platform-host>:3100","Machine")\n\ncd "C:\\Program Files\\${dir}"; .\\install.ps1`;
  } else if (platform === "mac") {
    const arch = `${svc}_${ver}_darwin_arm64.tar.gz`;
    code = `# Apple Silicon (arm64) — Intel: replace arm64 with amd64\ncurl -LO ${ghBase}/${arch}\ntar -xzf ${arch}\n\nexport TELEMETRYFLOW_API_KEY_ID="${id}"\nexport TELEMETRYFLOW_API_KEY_SECRET="${sec}"\nexport ENCRYPTION_KEY="${enc}"\nexport ${endVar}="http://<platform-host>:3100"\nsudo ./install.sh`;
  } else if (platform === "docker") {
    const ports = isAgent ? "" : "\n  -p 4317:4317 -p 4318:4318 \\";
    code = `docker run -d \\\n  --name ${svc} \\\n  --restart unless-stopped \\${ports}\n  -e TELEMETRYFLOW_API_KEY_ID="${id}" \\\n  -e TELEMETRYFLOW_API_KEY_SECRET="${sec}" \\\n  -e ENCRYPTION_KEY="${enc}" \\\n  -e ${endVar}="http://<platform-host>:3100" \\\n  telemetryflow/${svc}:${ver}`;
  }
  return codeBlock(code, "bash");
}

export function binaryCode(
  platform: InstallPlatform,
  service: "agent" | "collector",
  keys: KeyParams,
): string {
  const id  = keys.rawApiKeyId ?? keys.apiKeyId ?? "";
  const sec = keys.rawApiKeySecret;
  const enc = keys.rawEncryptKey;
  const isAgent = service === "agent";
  const ver    = isAgent ? TFO_AGENT_VERSION : TFO_COLLECTOR_VERSION;
  const svc    = isAgent ? "tfo-agent" : "tfo-collector";
  const endVar = isAgent ? "TELEMETRYFLOW_API_ENDPOINT" : "TELEMETRYFLOW_ENDPOINT";
  let code = "";
  if (["deb", "rpm", "tar"].includes(platform)) {
    code = `# Run ${svc} directly (binary must already be installed/extracted)\nTELEMETRYFLOW_API_KEY_ID="${id}" \\\nTELEMETRYFLOW_API_KEY_SECRET="${sec}" \\\nENCRYPTION_KEY="${enc}" \\\n${endVar}="http://<platform-host>:3100" \\\n${svc} start`;
  } else if (platform === "win") {
    code = `# PowerShell — set vars then run\n$env:TELEMETRYFLOW_API_KEY_ID = "${id}"\n$env:TELEMETRYFLOW_API_KEY_SECRET = "${sec}"\n$env:ENCRYPTION_KEY = "${enc}"\n$env:${endVar} = "http://<platform-host>:3100"\n.\\${svc}.exe start`;
  } else if (platform === "mac") {
    code = `# Run ${svc} directly\nexport TELEMETRYFLOW_API_KEY_ID="${id}"\nexport TELEMETRYFLOW_API_KEY_SECRET="${sec}"\nexport ENCRYPTION_KEY="${enc}"\nexport ${endVar}="http://<platform-host>:3100"\n./${svc} start`;
  } else if (platform === "docker") {
    const ports = isAgent ? "" : "\n  -p 4317:4317 -p 4318:4318 \\";
    code = `docker run -d \\\n  --name ${svc} \\\n  --restart unless-stopped \\${ports}\n  -e TELEMETRYFLOW_API_KEY_ID="${id}" \\\n  -e TELEMETRYFLOW_API_KEY_SECRET="${sec}" \\\n  -e ENCRYPTION_KEY="${enc}" \\\n  -e ${endVar}="http://<platform-host>:3100" \\\n  telemetryflow/${svc}:${ver}`;
  }
  return codeBlock(code, "bash");
}

export function dockerCliCode(
  service: "agent" | "collector",
  keys: KeyParams,
): string {
  const id  = keys.rawApiKeyId ?? keys.apiKeyId ?? "";
  const sec = keys.rawApiKeySecret;
  const enc = keys.rawEncryptKey;
  const isAgent = service === "agent";
  const ver    = isAgent ? TFO_AGENT_VERSION : TFO_COLLECTOR_VERSION;
  const svc    = isAgent ? "telemetryflow-agent" : "telemetryflow-collector";
  const endVar = isAgent ? "TELEMETRYFLOW_API_ENDPOINT" : "TELEMETRYFLOW_ENDPOINT";
  const ports  = isAgent ? "" : "\n  -p 4317:4317 -p 4318:4318 \\";
  const code = `docker run -d \\\n  --name ${svc} \\\n  --restart unless-stopped \\${ports}\n  -e TELEMETRYFLOW_API_KEY_ID="${id}" \\\n  -e TELEMETRYFLOW_API_KEY_SECRET="${sec}" \\\n  -e ENCRYPTION_KEY="${enc}" \\\n  -e ${endVar}="http://<platform-host>:3100" \\\n  telemetryflow/${svc}:${ver}`;
  return codeBlock(code, "bash");
}

// Static code blocks (no reactive keys needed)
export const helmRepoCode = codeBlock(
  `# Add TelemetryFlow Helm repo (first time only)
helm repo add telemetryflow https://charts.telemetryflow.io
helm repo update`,
  "bash",
);

export const k8sApplyCode = codeBlock(
  `# Save the manifest above as manifest/tfo-deployment.yaml, then:
kubectl apply -f manifest/tfo-deployment.yaml

# Verify Secret was created
kubectl get secret tfo-credentials -n telemetryflow

# Verify Agent & Collector pods are running
kubectl get pods -n telemetryflow`,
  "bash",
);

export const k8sRotateApplyCode = codeBlock(
  `# Apply updated Secret manifest
kubectl apply -f manifest/tfo-credentials.yaml

# Restart pods to pick up new credentials
kubectl rollout restart deployment/tfo-agent -n telemetryflow
kubectl rollout restart deployment/tfo-collector -n telemetryflow

# Verify rollout status
kubectl rollout status deployment/tfo-agent -n telemetryflow
kubectl rollout status deployment/tfo-collector -n telemetryflow`,
  "bash",
);

// ─── Composable ───────────────────────────────────────────────────────────────

export function useApiKeyGuide() {
  const implGuideTab = ref<ImplGuideTab>("install");
  const implInstallPlatform = ref<InstallPlatform>("deb");

  function resetGuide() {
    implGuideTab.value = "install";
    implInstallPlatform.value = "deb";
  }

  return {
    implGuideTab,
    implInstallPlatform,
    guideTabs,
    installPlatformOptions,
    rawOf,
    codeBlock,
    installCode,
    binaryCode,
    dockerCliCode,
    helmRepoCode,
    k8sApplyCode,
    k8sRotateApplyCode,
    resetGuide,
  };
}
