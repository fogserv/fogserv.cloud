# GitOps Research Log

**Status:** Active  
**Last Updated:** January 30, 2026 03:52 AM  
**Session:** Reviewed GitOps guidance on drift detection, policy enforcement, and automation observability  
**Tags:** GitOps, drift, telemetry

---

## Summary
GitOps is still about desired state, but recent guidance stresses controlling runaway agents (drift, automation, and policies) while improving observability so deployments never drift silently.

## Layer 1: Drift detection & reconciliation
- Weaveworks’ field guide emphasizes declarative state and reconciliation loops that compare Merkle trees, normalize manifests, and log every diff so drift shows up in the GitOps dashboard.
- CNCF guidance reminds teams to tie drift alerts back to tickets so the KB captures the “why” for each remediation.
- ArgoCD itself cannot see runtime drift (in-memory config, autoscalers, external controllers), so teams must layer runtime instrumentation, policy engines, and manual verification to avoid silent divergence.

## Layer 2: Automation & policy enforcement
- Configure GitOps controllers (ArgoCD/Flux) to auto-detect drift and reconcile continuously; automated rollbacks should also trigger health-checked progress.
- Implement immutable releases linked to Git commit SHAs so any rollback restores a known state and the provenance is auditable.
- Operators must normalize metadata, watch events, and compare hashed states so they only reconcile confirmed divergences; avoid reconciling fields mutated by Kubernetes itself.
- Use progressive delivery (canaries/blue-green) plus automated rollback triggers (Argo Rollouts) so failures are contained before they reach prod.

## Layer 3: Observability & telemetry tie-ins
- Cross-region clusters often suffer fragmented telemetry, inconsistent dashboards, and limited visibility into GitOps automation status; centralize logs, correlate deployment IDs, and alert on sync failures across regions.
- Augment GitOps observability with AI-driven analysis so incident reviews can surface latent issues that manual monitors miss (error aggregation, FinOps impacts).
- Keep secrets outside Git (Dotenvx + Vault), enforce CI/CD pipeline checks, and treat every deployment notification (success or failure) as part of the audit trail.

## Next Steps
1. Update `gitops/gitops.md` to call out Gatekeeper policies and the Forgejo Action that fail PRs missing KB updates.  
2. Document the telemetry linkage (deployment ID → dashboard) within this research log and the GitOps entry.  
3. Keep a list of drift incidents in the KB with their corresponding Git tags and ticket numbers.

## Sources & Related
- Medium: common pitfalls for GitOps microservices (drift, observability).
- Medium: ArgoCD shows where runtime drift hides (semantic drift, autoscalers).
- GitOps automation reference (drift detection, rollback).
- Spacelift best practices (immutable releases, drift alerts).
- UMA drift operator guidance (Merkle reconciliation, normalization).
- LinkedIn guide (AI/FinOps maturity).
- UMA observability gaps (cross-region telemetry).
- Aviator blog (progressive delivery & rollbacks).

## Change Log
- January 30, 2026 03:52 AM — Added drift detection, policy, and telemetry research for GitOps with citations for follow-up actions in the KB.
