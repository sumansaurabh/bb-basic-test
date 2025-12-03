Here is a **clean, production-ready Markdown guide** that documents **everything you actually did**, including what failed, why it failed, and the exact commands that finally worked.

You can paste this directly into a GitHub README.

---

# 🚀 **Google Cloud Run + HTTPS Load Balancer + Wildcard SSL + Root Domain**

### **Full Working Guide (Based on Real Debug Session)**

This guide documents the *exact* steps required to expose a Cloud Run service behind a Google Cloud HTTPS Load Balancer using a **wildcard Let’s Encrypt certificate** and a **root domain** (e.g., `bareflux.co`).
It includes all misconfigurations encountered and the final working solution.

---

# 🧭 **Overview**

Final working architecture:

```
bareflux.co → Global HTTPS Load Balancer  
             → HTTPS Proxy + SSL Certificate  
             → URL Map  
             → Backend Service (HTTP/2, no ports)  
             → Serverless NEG  
             → Cloud Run service (bb-1)
```

This is the correct configuration for Cloud Run behind an external HTTPS Load Balancer.

---

# 🧱 **Prerequisites**

* Cloud Run service deployed: **`bb-1`** in **`europe-west1`**
* GCP project: **`penify-prod`**
* Root domain: **`bareflux.co`**
* Wildcard certificate files:

  * `fullchain.pem`
  * `privkey.pem`
* DNS provider (Cloudflare recommended)

---

# ❌ **What Failed & Why (Critical Lessons)**

### 1. **TLS handshake failures (`SSL_ERROR_SYSCALL`)**

Cause: Backend service was created with:

```
protocol: HTTP
port: 80
portName: http
```

Cloud Run requires:

```
protocol: HTTP2
(no port)
(no portName)
```

### 2. **Serverless NEG attachment failure**

Error:

```
Port name is not supported for a backend service with Serverless NEGs
```

Reason: GCP CLI automatically injected:

```
port: 80
portName: http2
```

### 3. **Missing HTTPS proxy**

Without a proxy, load balancer cannot terminate SSL.

### 4. **Missing forwarding rule**

LB never received HTTPS traffic until rule was created.

### 5. **Local macOS DNS cache issues**

Fixed via:

```bash
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

---

# ✅ **Final Working Commands (Step-by-Step)**

This is the **canonical**, clean version of what succeeded.

---

# 1️⃣ Create Serverless NEG for Cloud Run

```bash
gcloud compute network-endpoint-groups create neg-bb-1 \
  --region=europe-west1 \
  --network-endpoint-type=serverless \
  --cloud-run-service=bb-1 \
  --project=penify-prod
```

---

# 2️⃣ Create Backend Service (JSON import required)

Cloud Run backends **must not** have port or portName fields.
The GCP CLI injects ports automatically, so we bypass it using JSON import.

### Create backend.json:

```bash
cat <<EOF > backend.json
{
  "name": "backend-bb-1",
  "loadBalancingScheme": "EXTERNAL_MANAGED",
  "protocol": "HTTP2",
  "timeoutSec": 30
}
EOF
```

### Import backend:

```bash
gcloud compute backend-services import backend-bb-1 \
  --global \
  --source=backend.json \
  --project=penify-prod
```

### Attach Serverless NEG:

```bash
gcloud compute backend-services add-backend backend-bb-1 \
  --global \
  --network-endpoint-group=neg-bb-1 \
  --network-endpoint-group-region=europe-west1 \
  --project=penify-prod
```

---

# 3️⃣ Create URL Map

```bash
gcloud compute url-maps create urlmap-bb-1 \
  --default-service=backend-bb-1 \
  --project=penify-prod
```

---

# 4️⃣ Upload Wildcard Let’s Encrypt Certificate

Ensure correct permissions:

```bash
sudo chown $USER fullchain.pem privkey.pem
chmod 600 fullchain.pem privkey.pem
```

Upload:

```bash
gcloud compute ssl-certificates create cert-bb-1 \
  --certificate=fullchain.pem \
  --private-key=privkey.pem \
  --global \
  --project=penify-prod
```

---

# 5️⃣ Create HTTPS Proxy

```bash
gcloud compute target-https-proxies create proxy-bb-1 \
  --url-map=urlmap-bb-1 \
  --ssl-certificates=cert-bb-1 \
  --project=penify-prod
```

---

# 6️⃣ Reserve Global IP Address

```bash
gcloud compute addresses create ip-bb-1 \
  --global \
  --project=penify-prod
```

Retrieve it:

```bash
gcloud compute addresses describe ip-bb-1 \
  --global \
  --project=penify-prod \
  --format="get(address)"
```

---

# 7️⃣ Create Forwarding Rule (port 443 → proxy)

```bash
gcloud compute forwarding-rules create fr-bb-1 \
  --global \
  --target-https-proxy=proxy-bb-1 \
  --ports=443 \
  --address=ip-bb-1 \
  --project=penify-prod
```

---

# 8️⃣ Configure DNS (Cloudflare)

Create:

```
Type: A
Name: @
Value: <GLOBAL_IP_FROM_STEP_6>
TTL: Auto
Proxy: OFF (DNS only)
```

**Cloud Run load balancers require DNS-only mode** (no orange cloud).

---

# 🚦 Validation

### Test:

```bash
curl -v https://bareflux.co
```

Expected:

```
* SSL connection using TLSv1.3
< HTTP/2 200
server: Google Frontend
```

---

# 🎉 **Final Architecture (Working)**

```
bareflux.co  
   ↓
Global HTTPS Load Balancer  
   ↓
HTTPS Proxy (cert-bb-1)  
   ↓
URL Map  
   ↓
Backend Service (HTTP2, no ports)  
   ↓
Serverless NEG (neg-bb-1)  
   ↓
Cloud Run (bb-1)
```

---

# 📚 **Troubleshooting Table**

| Issue                       | Cause                             | Fix                                  |
| --------------------------- | --------------------------------- | ------------------------------------ |
| TLS handshake fails         | Backend has port/portName         | Recreate backend via JSON            |
| `Port name not supported`   | Serverless NEG + portName=http2   | Remove port fields via JSON          |
| DNS resolves but curl fails | macOS DNS cache                   | Flush DNS cache                      |
| Cert not applied            | HTTPS proxy missing               | Create `proxy-bb-1` with certificate |
| 404 from LB                 | URL map pointing to wrong backend | Reassign URL map                     |

---

# 🏁 Conclusion

You now have a **production-grade**, fully working, correctly configured Cloud Run → Load Balancer deployment with:

* Wildcard SSL
* Root domain
* HTTP/2 backend
* Serverless NEG
* Fully automated routing

This setup is extremely powerful and scalable, and the JSON backend creation is the **key trick** that Google never documents.
