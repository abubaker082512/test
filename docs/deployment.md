# Deployment Guide (Next.js Retro BetPK Clone)

This guide covers deploying the BetPK Clone project to a production environment with RapidAPI/Jili integration.

Prerequisites
- Node.js 18+ in production
- Access to environment variables for RapidAPI credentials
- Hosting choice (Vercel, AWS, DigitalOcean, or custom VM)

1) Environment configuration
- Create a secure environment file or secrets store for:
  - RAPIDAPI_KEY
  - RAPIDAPI_HOST
  - NEXT_PUBLIC_USE_MOCK (optional, default false in prod)

2) Build & Run
- Local development (for testing):
  - npm install
  - npm run dev
- Production build (example for Vercel or Node server):
  - npm install
  - npm run build
  - npm run start

3) Deployment considerations
- If deploying to Vercel (serverless): ensure Next.js API routes are compiled and that MCP path is avoided unless you host a persistent MCP container elsewhere.
- If deploying to AWS (EC2/ECS) or a container-based host: you can run the Next.js app with a Node process, and optionally add a reverse proxy (Nginx) and TLS termination.
- Environment variables mapping:
  - RAPIDAPI_KEY
  - RAPIDAPI_HOST
  - NEXT_PUBLIC_USE_MOCK (default true for local testing, set false for live)
- Observability: hook into your cloud logs and metrics stack; see Step 4 below.
- Ensure server has access to environment variables at runtime
- If using serverless (Vercel), ensure MCP path is avoided if the container lacks persistent storage
- Enable TLS, set security headers, and enable basic rate limiting (either via middleware or hosting provider)
- Logging/Observability: integrate with your cloud logging/monitoring (CloudWatch, Stackdriver, etc.)

4) OpenAPI & docs
- Use docs/openapi.yaml to validate contracts
- Use docs/postman-collection.json (not yet added) for API consumers

5) Post-deploy checks
- Health endpoint returns 200
- Catalog and GetGameUrl endpoints respond with expected shapes
- The game launcher iframe loads correctly in all supported browsers

This is a living document; update with region-specific requirements and security policies as you scale.

4) Quick-start for specific providers
- Vercel: ensure you add the above env vars in the project settings; deploy as a standard Next.js app.
- AWS: deploy with a small Node/Next.js container; set up CI/CD if desired.
- For MCP path: ensure you run within a containerized or VM environment that supports npx mcp-remote; not recommended on most serverless platforms.
