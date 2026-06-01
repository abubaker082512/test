# BetPK Clone – Requirements Document (Jili API Integration)</br>

This document outlines a comprehensive requirements baseline for building a BetPK‑style online betting and iGaming platform, with integration points for the Jili game API. It aims to establish a clear, shared understanding of product scope, regulatory considerations, architecture, data models, and milestones to guide design, implementation, and QA.

Note: The target jurisdiction(s) and regulatory licenses must be defined early. This document presents a robust, risk‑aware blueprint suitable for markets where online sports betting and casino games are legally permitted and regulated.

## 1. Executive Summary
- Build a BetPK‑style platform offering sportsbook, live betting, and casino games (including Jili‑powered titles) with a unified wallet, promotions engine, and comprehensive admin tooling.
- Core aim: deliver a scalable, secure, compliant, and localizable user experience across multiple regions, with a modular architecture enabling rapid feature delivery and third‑party integrations.
- Primary success metrics: activation rate, average revenue per user (ARPU), bettor retention, time‑to‑balance/withdrawal, uptime, and fraud detection efficiency.

## 2. Scope & Boundaries
- In scope:
  - User lifecycle: registration, login, KYC/AML checks, identity verification, age gating, and self‑service account management.
  - Wallet & payments: deposits, withdrawals, balance management, currency handling, and payment provider integrations.
  - Sportsbook: event catalog, markets, odds feeds, live betting, in‑play updates.
  - Casino & games lobby: catalog of casino games (via Jili API) with launching/embedding in the client, session management, and win/loss reporting.
  - Promotions: welcome bonuses, ongoing promos, wagering requirements handling, and loyalty tiers.
  - Admin portal: user management, risk controls, event/odds management, game catalog, promotions, reports, and monitoring.
- Out of scope (for MVP): social features beyond chats/notifications, fantasy sports, and non‑gambling affiliate programs.

## 3. Target Markets & Compliance (Regulatory Considerations)
- Determine licensed jurisdictions (e.g., Curacao, Malta, UK‑Gambling Commission, etc.).
- Apply KYC (Know Your Customer) and AML (Anti‑Money Laundering) controls at onboarding and at large/risk events.
- Age verification to ensure players are of legal gambling age.
- Responsible gaming: account limits, cooling‑off and self‑exclusion tools, and activity monitoring.
- Data privacy: comply with GDPR/analogous regimes; data minimization and data localization where required.
- Geolocation checks to enforce geographic restrictions.
- PCI DSS scope considerations for payment processing; tokenization and secure storage policies.

## 4. Target Audience & Personas
- Casual bettors seeking quick, intuitive bets on sports and live events.
- Serious bettors seeking live in‑play and advanced markets.
- Casino players looking for a broad catalog of games (slots, table games, live casino) via a single platform.
- Admins and risk analysts who monitor bets, players, and transactions.

## 5. MVP Features (Product Scope)
- User & Identity
  - Self‑service registration with email/phone verification.
  - Passwordless options (optional) and multi‑factor authentication (MFA).
  - KYC workflow hooks and status indicators.
- Wallet & Payments
  - Unified wallet, currency support, and real‑time balance updates.
  - Deposits and withdrawals via multiple providers; success/fail handling and reconciliation.
  - Transaction history and receipts.
- Sportsbook
  - Event catalog, markets, odds feeds, bet placement, and real‑time in‑play updates.
  - Bet history, settlements, and cash‑out (where supported).
- Casino & Games (Jili API Integration)
  - Game catalog listing with category filtering (slots, table, live casino).
  - Game launching/embedding via Jili API (iframe or SDK) with session mapping to user accounts.
  - Session management for game play and balance reconciliation.
- Promotions & Loyalty
  - Welcome bonus, deposit bonuses, free bets (conceptual rules), wagering requirements tracking.
  - Loyalty tiering and reward accrual.
- Admin & Ops
  - User management, risk flags, and fraud alerts.
  - Odds/event management and promotions configuration.
  - Basic analytics dashboards (live bets, revenue, active users).
- Security & Observability
  - Encryption in transit and at rest, secure authentication, and audit logging.
  - Monitoring, alerts, and basic anomaly detection.

## 6. Non‑Functional Requirements (NFRs)
- Performance: scalable to peak event volumes; 95th percentile latency targets for odds retrieval and bet placement.
- Availability: 99.9%+ uptime for core services; disaster recovery plan and weekly backups.
- Security: OWASP Top 10 mitigations, penetration testing cadence, incident response runbooks.
- Reliability: robust session management, idempotent bet placements, and retry logic.
- Compliance: auditable controls and data lineage; GDPR data handling; regional data residency where required.
- Localization: multi‑language UI, currency formatting, and region‑specific promotions.
- Accessibility: responsive UI, keyboard navigability, and screen‑reader compatibility where feasible.

## 7. System Architecture (High Level)
- Frontend: responsive web app with a React/modern JS stack; iframes/SDKs for Jili games; real‑time updates via WebSocket or SSE.
- Backend services (microservices or modular monolith):
  - Auth Service: authentication, MFA, sessions, and authorization.
  - Wallet & Payments Service: balance, deposits, withdrawals, reconciliation.
  - Sportsbook Service: markets, odds streams, bet placement, settlements.
  - Casino Service: game catalog, session mapping, and integration adapters for Jili API.
  - Promotions Service: bonuses, wagering rules, loyalty tiers.
  - Admin Service: user risk scoring, content management, reports.
  - Compliance & Risk Service: KYC/AML checks, geolocation, and fraud detection.
- Data & Storage
  - Relational database for users, bets, transactions, and promotions.
  - NoSQL/Cache (Redis) for sessions and fast odds caches.
  - Object storage for assets and logs.
- Integrations
  - Jili Game API integration: game list fetch, session management, and result reporting.
  - Payment gateways: providers with payout/reversal support.
  - KYC/AML providers: identity verification and risk checks.
  - Geo/IP geolocation and anti‑fraud services.
- Observability
  - Logging, metrics, tracing; centralized dashboards.
  - Alerting for abnormal betting patterns and payment failures.

## 8. Data Model (High Level)
- User: id, profile, KYC status, verification documents, risk flags, preferences, locale, currency.
- Wallet: user_id, balances by currency, transaction history.
- Bet: id, user_id, event_id, market, type, odds, stake, potential_payout, status, settled_at.
- Transaction: id, user_id, type (deposit/withdrawal/bet/adjustment), amount, currency, status, timestamp, reference.
- GameSession: id, user_id, game_id, provider, session_token, started_at, ended_at, win_amount.
- Promotion: id, type, rules, start/end, user eligibility, status.
- Event/Market: event_id, sport, league, teams, start_time, current_odds, status.
- AuditLog: action, actor, target_id, timestamp, details.

Note: The above is a schematic; implement detailed schemas in alignment with chosen ORM/DBs and data governance policies.

## 9. API Design (High Level)
- Public/Partner APIs (for internal services and administrators):
  - Auth: login, logout, refresh, MFA checks.
  - User: profile, KYC status, preferences.
  - Wallet: balance, deposit/withdrawal requests, transaction history.
  - Sportsbook: events, markets, odds streams, place bet, cash out.
  - Casino: list games, launch game, session status, report results.
  - Promotions: apply bonuses, track wagering, redeem rewards.
- Jili API integration endpoints (adapter layer): fetch game catalog, create game session, map user in.id to Jili player, handle game results, reconcile balances.
- Data privacy and audit endpoints for compliance.

## 10. Jili API Integration Plan (High Level)
- Partner onboarding: establish contract, API keys, terms of service for game integration.
- Catalog integration: fetch Jili games catalog, apply local filters (language, currency, regional restrictions).
- Session management: when a user starts a Jili game, create a corresponding game session linked to the user and wallet balance; on game end, settle bets/winnings in the platform wallet.
- Balance reconciliation: ensure balances between the platform and Jili provider stay consistent; handle edge cases (network errors, timeouts).
- Real‑time events: subscribe to game events (round results, jackpots, bonus rounds) and surface to users if applicable.
- Security: secure API keys, IP restrictions, and rate limiting for the adapter layer.
- Compliance: ensure data shared with the provider complies with licensing and data residency requirements.
- Monitoring: track game latency, error rates, and reconciliation latencies; alert on anomalies.

## 11. Risk, Security & Compliance (Key Controls)
- Identity & access: role‑based access control (RBAC), MFA for admins, least privilege for services.
- Data protection: TLS in transit, encryption at rest, key management, and data minimization.
- Fraud detection: pattern analysis, velocity checks, device fingerprinting, and risk scoring.
- Responsible gaming: account limits, pause/close account features, and activity monitoring.
- Regulatory reporting: wager reporting, suspicious activity reports (where required), tax reporting where applicable.
- Incident response: playbooks, on‑call schedules, and post‑mortem processes.

## 12. Localization, Accessibility & UX
- Language packs and currency formats per region.
- Localized terms, promos, and customer support channels.
- Accessibility: keyboard navigation, screen reader support, color contrast compliance where feasible.

## 13. Testing Strategy
- Unit and integration tests for all services.
- End‑to‑end tests for core flows: registration, deposit, bet placement, game launching, payout, and withdrawal.
- Performance/load testing for peak events and simultaneous game sessions.
- Security testing (SAST/DAST, dependency checks, regular penetration tests).
- Compliance testing: data handling, retention policies, and geo restrictions.

## 14. Deployment, Ops & Observability
- Environment separation: dev/stage/prod with feature flag controls.
- CI/CD pipelines for services and frontend; automated tests gating deploys.
- Observability: logging, metrics (Prometheus), tracing (Jaeger/OpenTelemetry), dashboards.
- Backups and disaster recovery: weekly backups, RPO/RTO targets.
- CDN and caching: static assets, game assets, and dynamic API responses where appropriate.

## 15. MVP Roadmap & Milestones
- Phase 1: Foundations
  - Architecture & tech stack decisions; auth, wallet, basic sportsbook, and admin scaffold.
- Phase 2: Jili integration prototype
  - Catalog fetch, session mapping, basic game launching, and balance reconciliation.
- Phase 3: Payments & KYC/AML enablement
- Phase 4: Promotions, loyalty, and regionalization
- Phase 5: Beta launch in select markets, QA, security hardening, and performance tuning.

## 16. Acceptance Criteria (Sample)
- A user can register, complete KYC, and deposit funds via at least two payment providers.
- User can place a real bet on an event and receive a real‑time settlement or cash out where supported.
- Jili games catalog loads and users can launch games with a consistent balance across the platform.
- Admin can configure a new promotion and it immediately reflects in user dashboards.
- System meets uptime, security, and compliance targets defined in NFRs.

## 17. Open Questions for Stakeholders
- Which jurisdictions will we target first, and what licenses are required?
- Do we want a pure sportsbook + casino aggregator, or a sportsbook‑heavy platform with casino as secondary?
- Which payment providers are acceptable (local/regional)? Any constraints on payouts and KYC tooling?
- Do we require live dealer casino games beyond Jili’s offerings?
- What branding, localization, and marketing assets are preferred?

## 18. Appendices
- A. Glossary
- B. Reference Architecture Diagram (textual)
- C. Data Schema Sketches (tables and example fields)
- D. API Contract Skeleton (endpoint names, request/response shapes)

References:
- BetPK public site notes and typical online betting features inferred from the domain.
- General industry patterns for sportsbook and casino platform architectures.
- Jili API integration patterns (publicly discussed patterns in industry literature).

This document is intended as a living artifact. It should be refined with concrete regulatory requirements, branding guidelines, and technical decisions as the project progresses.
