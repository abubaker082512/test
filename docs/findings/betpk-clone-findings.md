# BetPK Clone – Findings & Observations

This document captures key findings from preliminary research on building a BetPK‑style wagering site and integrating a Jili game API. It highlights market/UX signals, technical feasibility notes, compliance implications, data considerations, risks, and recommended next steps.

## 1) Public site observations (BetPK)
- Public branding and landing content suggest a sportsbook + casino model, but public content is limited in initial checks.
- The site exposes a simple welcome banner and a game/image asset reference, with no readily visible feature catalog or API docs from the public surface.
- Implication: the actual feature surface and data flows must be clarified via stakeholder discovery and direct vendor/partner communications. A formal requirements baseline should assume a sportsbook+casino catalog with live odds, wallet, and game integrations.

## 2) Jili API integration landscape (industry pattern)
- Jili game providers typically offer: game catalog, session management, real‑time game events, and balance reconciliation via an adapter/lac alias.
- Common integration patterns involve a front‑end game launcher (embed/iframe or SDK), a back‑end adapter to map platform wallets to provider sessions, and reconciliation jobs for wins/losses.
- Risks include latency in game state replication, payout reconciliation mismatches, and dependency on provider uptime.
- Implication: plan a robust Jili adapter layer with idempotent operations, proper error handling, and observability around latency and reconciliation.

## 3) Compliance & regulatory considerations (high level)
- Online gambling platforms require licensing, KYC/AML controls, geolocation, and responsible gaming tooling.
- Data privacy (GDPR/local laws), secure payments (PCI scope considerations), and periodic regulatory reporting are essential.
- Implementation should separate regulatory requirements by jurisdiction and support regional configurations.

## 4) Core data & system implications (high level)
- Key domain areas: User, Wallet, Bet, Transaction, Event/Market, GameSession, Promotion, AuditLog.
- A reliable data model is needed to support real‑time odds, live bet settlements, and game state mapping between platform and Jili.
- Caching for odds and session state will be critical to meet latency targets during peak events.

## 5) Security, risk & UX findings
- Security: strong authentication, RBAC for admins, encryption in transit, and secure storage of sensitive data.
- Fraud risk: large bets, rapid wallet movements, and multi‑account risk require monitoring and automated alerts.
- UX: a clean, responsive interface for sportsbook events alongside a casino lobby; Jili game integration must be seamless and compliant with localizations.

## 6) Gaps & assumptions
- Gap: Publicly available BetPK feature docs or API docs are not visible; assumption: a BetPK‑like MVP will include sportsbook + casino via Jili.
- Gap: Regulatory requirements per jurisdiction are undefined; assumption: start with a compliant, license‑backed approach in a single or few markets.
- Assumption: Jili adapter will support catalog fetch, session creation, and settlement callbacks; further details to be confirmed with provider docs.

## 7) Risks (top items)
- Regulatory/licensing risk if markets expand without proper licenses.
- Dependency risk on Jili provider uptime, catalog availability, and API quotas.
- Financial risk around balance reconciliation and cross‑provider settlement accuracy.
- Data/privacy and security risk if data access controls are weak or misconfigured.

## 8) Recommendations & Next steps
- Validate target jurisdictions and obtain required licenses; align KYC/AML vendors and geolocation services.
- Define MVP scope concretely (sportsbook features, casino catalog scope, Jili integration depth).
- Architect a modular backend with an adapter layer for Jili, a wallet service, and a promotions engine.
- Design data models and API contracts in collaboration with frontend and operations teams.
- Implement a phased roadmap focused on governance, security, and observability (logging, metrics, tracing).
- Prepare OpenAPI specifications for core services and the Jili adapter to accelerate implementation.

## 9) Open questions for stakeholders
- Which jurisdictions and licenses are prioritized for initial launch?
- Do we target a sportsbook‑heavy MVP with casino as a companion feature or an equal‑weight sportsbook/casino MVP?
- Preferred payment providers and payout rules per region?
- Must we support live dealer games beyond Jili catalog, or rely solely on Jili titles?
- Branding, localization requirements, and design constraints for the MVP?

## 10) Deliverables for the next phase
- Confirmed regulatory plan and licensing requirements.
- Detailed data model definitions (ER diagrams or schema files).
- API contracts for core services and Jili adapter (requests/responses, authentication, error handling).
- Prototype architecture diagram (high‑level components and data flows).
- MVP backlog with user stories, acceptance criteria, and success metrics.

This findings document is intended to be updated as concrete regulatory decisions, partner capabilities, and design choices are clarified.
