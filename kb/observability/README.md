# Observability - Monitoring, Metrics & Logs

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Monitoring & Observability  
**Prerequisites**: [kb/basics/](../basics/), [kb/containers/docker-basics](../containers/docker-basics)  
**Tags**: monitoring, metrics, logs, observability, prometheus, grafana, netdata, self-hosted

## Summary

Complete observability stack learning path using self-hosted open-source tools. From simple uptime monitoring through complete Prometheus + Grafana + Loki stacks for production infrastructure.

## 🎯 Learning Philosophy

**See Everything, Understand Everything**:
```
Uptime → Metrics → Logs → Traces → Alerts → Dashboards
(Alive?)  (Health)  (What)  (Why)    (Know)    (Visualize)
```

This directory teaches observability assuming **running services** but no prior monitoring experience. Progressive implementation from basic checks through comprehensive production observability.

## 📚 Learning Path

```
Prerequisites: Running services to monitor
         ↓
┌────────────────────────────────────────┐
│  PHASE 1: Basic Monitoring             │
│  ├─ Why monitor?                       │
│  ├─ Uptime checks (Uptime Kuma)        │
│  ├─ Simple metrics (Netdata)           │
│  ├─ Alert basics                       │
│  └─ Monitoring mindset                 │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 2: Metrics Collection           │
│  ├─ Prometheus fundamentals            │
│  ├─ Node Exporter (system metrics)     │
│  ├─ Container metrics (cAdvisor)       │
│  ├─ Application metrics                │
│  └─ Service discovery                  │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 3: Visualization                │
│  ├─ Grafana setup                      │
│  ├─ Dashboard creation                 │
│  ├─ Pre-built dashboards               │
│  ├─ Custom queries (PromQL)            │
│  └─ Variables and templating           │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 4: Logging                      │
│  ├─ Centralized logging why            │
│  ├─ Loki setup                         │
│  ├─ Promtail for log shipping          │
│  ├─ LogQL queries                      │
│  └─ Log aggregation patterns           │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 5: Advanced & Production        │
│  ├─ Distributed tracing (Jaeger)       │
│  ├─ Alertmanager configuration         │
│  ├─ On-call workflows                  │
│  ├─ SLOs and SLIs                      │
│  └─ Observability-driven development   │
└────────────────────────────────────────┘
```

## 📖 Articles in This Directory

### 🟢 Phase 1: Basic Monitoring (Start Here)

**Simple is Beautiful**:
1. **[why-monitor](why-monitor)** - The importance of observability
   - What can go wrong
   - MTTR vs MTTD
   - Unknown unknowns
   - When to monitor
   - **Prerequisites**: None
   - **Time**: 30 minutes
   - **Resources**: `[█░░░░░░░░░]` 10% - Conceptual

2. **[uptime-kuma-setup](uptime-kuma-setup)** - Beautiful uptime monitoring
   - Uptime Kuma installation
   - HTTP checks
   - TCP checks
   - Docker health monitoring
   - Status pages
   - **Prerequisites**: Docker basics
   - **Time**: 1-2 hours
   - **Resources**: `[███░░░░░░░]` 30%

3. **[netdata-basics](netdata-basics)** - Real-time system monitoring
   - Netdata installation
   - System metrics dashboard
   - Container monitoring
   - Zero-config setup
   - Alert configuration
   - **Prerequisites**: Linux basics
   - **Time**: 1-2 hours
   - **Resources**: `[███░░░░░░░]` 30%

4. **[simple-alerts](simple-alerts)** - Get notified when things break
   - Email alerts
   - Slack/Discord webhooks
   - Telegram notifications
   - Alert fatigue prevention
   - **Prerequisites**: Monitoring setup
   - **Time**: 2 hours
   - **Resources**: `[██░░░░░░░░]` 20%

### 🟡 Phase 2: Metrics Collection (The Foundation)

5. **[prometheus-introduction](prometheus-introduction)** - Metrics database
   - What is Prometheus
   - Pull vs Push metrics
   - Time series data
   - PromQL basics
   - Architecture overview
   - **Prerequisites**: Monitoring concepts
   - **Time**: 2 hours
   - **Resources**: `[███░░░░░░░]` 30%

6. **[prometheus-installation](prometheus-installation)** - Setting up Prometheus
   - Docker compose deployment
   - Configuration file
   - Scrape configs
   - Storage retention
   - Data persistence
   - **Prerequisites**: Docker basics
   - **Time**: 2-3 hours
   - **Resources**: `[█████░░░░░]` 50% - 2GB RAM

7. **[node-exporter](node-exporter)** - System metrics collection
   - Node Exporter setup
   - CPU, memory, disk metrics
   - Network statistics
   - Custom text file metrics
   - **Prerequisites**: Prometheus running
   - **Time**: 1-2 hours
   - **Resources**: `[██░░░░░░░░]` 20%

8. **[exporters-catalog](exporters-catalog)** - Exporter ecosystem
   - PostgreSQL exporter
   - Redis exporter
   - Nginx exporter
   - Blackbox exporter
   - Custom exporters
   - **Prerequisites**: Prometheus basics
   - **Time**: 3-4 hours
   - **Resources**: `[████░░░░░░]` 40%

9. **[service-discovery](service-discovery)** - Auto-discover targets
   - File-based discovery
   - DNS service discovery
   - Docker service discovery
   - Kubernetes service discovery
   - **Prerequisites**: Prometheus proficiency
   - **Time**: 2-3 hours
   - **Resources**: `[█████░░░░░]` 50%

### 🟠 Phase 3: Visualization (Making Sense of Data)

10. **[grafana-setup](grafana-setup)** - Beautiful dashboards
    - Grafana installation
    - First login and config
    - Adding Prometheus datasource
    - User management
    - **Prerequisites**: Prometheus running
    - **Time**: 1-2 hours
    - **Resources**: `[████░░░░░░]` 40% - 1GB RAM

11. **[first-dashboard](first-dashboard)** - Creating dashboards
    - Dashboard basics
    - Panel types
    - Query builder
    - Visualization options
    - Dashboard variables
    - **Prerequisites**: Grafana installed
    - **Time**: 2-3 hours
    - **Resources**: `[████░░░░░░]` 40%

12. **[promql-queries](promql-queries)** - Prometheus query language
    - PromQL syntax
    - Selectors and matchers
    - Functions and operators
    - Rate calculations
    - Aggregations
    - **Prerequisites**: Prometheus basics
    - **Time**: 4-5 hours
    - **Resources**: `[██████░░░░]` 60%

13. **[dashboard-library](dashboard-library)** - Pre-built dashboards
    - Grafana dashboard marketplace
    - Node Exporter dashboard
    - Docker monitoring
    - k8s monitoring
    - Customizing imports
    - **Prerequisites**: Grafana basics
    - **Time**: 2 hours
    - **Resources**: `[███░░░░░░░]` 30%

14. **[dashboard-best-practices](dashboard-best-practices)** - Design principles
    - Dashboard hierarchy
    - Signal vs noise
    - Color conventions
    - Annotations
    - Sharing dashboards
    - **Prerequisites**: Dashboard experience
    - **Time**: 2 hours
    - **Resources**: `[████░░░░░░]` 40%

### 🔴 Phase 4: Logging (Centralized Log Management)

15. **[loki-introduction](loki-introduction)** - Like Prometheus, for logs
    - What is Loki
    - Log aggregation architecture
    - Labels vs full-text search
    - Cost-effective logging
    - **Prerequisites**: Prometheus understanding
    - **Time**: 1-2 hours
    - **Resources**: `[███░░░░░░░]` 30%

16. **[loki-setup](loki-setup)** - Installing Loki stack
    - Loki installation
    - Storage configuration
    - Retention policies
    - High availability
    - **Prerequisites**: Docker basics
    - **Time**: 2-3 hours
    - **Resources**: `[██████░░░░]` 60% - 2-4GB RAM

17. **[promtail-setup](promtail-setup)** - Shipping logs to Loki
    - Promtail agent installation
    - Log file discovery
    - Label extraction
    - Pipeline stages
    - Docker/k8s integration
    - **Prerequisites**: Loki running
    - **Time**: 2-3 hours
    - **Resources**: `[███░░░░░░░]` 30%

18. **[logql-queries](logql-queries)** - Querying logs
    - LogQL syntax
    - Stream selectors
    - Log pipeline
    - Metric queries from logs
    - Real-world examples
    - **Prerequisites**: Loki + Promtail
    - **Time**: 3-4 hours
    - **Resources**: `[█████░░░░░]` 50%

19. **[log-aggregation-patterns](log-aggregation-patterns)** - Production logging
    - Structured logging
    - JSON logs
    - Correlation IDs
    - Log levels
    - Performance considerations
    - **Prerequisites**: Logging experience
    - **Time**: 3 hours
    - **Resources**: `[██████░░░░]` 60%

### ⚫ Phase 5: Advanced & Production (Complete Observability)

20. **[alertmanager-setup](alertmanager-setup)** - Alert routing
    - Alertmanager installation
    - Alert rules in Prometheus
    - Routing trees
    - Silences and inhibitions
    - Integration with ticketing
    - **Prerequisites**: Prometheus proficiency
    - **Time**: 3-4 hours
    - **Resources**: `[█████░░░░░]` 50%

21. **[on-call-workflows](on-call-workflows)** - Incident response
    - On-call best practices
    - Alert escalation
    - PagerDuty alternatives (open-source)
    - Runbooks and playbooks
    - Post-mortems
    - **Prerequisites**: Production experience
    - **Time**: 2-3 hours
    - **Resources**: `[████░░░░░░]` 40% - Conceptual

22. **[distributed-tracing](distributed-tracing)** - Jaeger setup
    - What is distributed tracing
    - Jaeger installation
    - Instrumenting applications
    - Trace analysis
    - **Prerequisites**: Microservices
    - **Time**: 4-5 hours
    - **Resources**: `[███████░░░]` 70%

23. **[slos-and-slis](slos-and-slis)** - Service level objectives
    - SLIs, SLOs, SLAs explained
    - Defining objectives
    - Error budgets
    - Measuring reliability
    - **Prerequisites**: Production monitoring
    - **Time**: 2-3 hours
    - **Resources**: `[█████░░░░░]` 50% - Conceptual

24. **[observability-driven-development](observability-driven-development)** - Build observability in
    - Instrumentation from day 1
    - Metrics in code
    - Structured logging
    - Tracing spans
    - Testing observability
    - **Prerequisites**: Development experience
    - **Time**: 3-4 hours
    - **Resources**: `[██████░░░░]` 60%

## 🔗 What Comes Next?

After mastering observability:

**For Infrastructure**:
- **[kb/infrastructure/monitoring-automation](../infrastructure/monitoring-automation)** - IaC for monitoring

**For Containers**:
- **[kb/containers/k0s-monitoring](../containers/k0s-monitoring)** - k8s observability

**For CI/CD**:
- **[kb/cicd/monitoring-pipelines](../cicd/monitoring-pipelines)** - Pipeline metrics

**For Security**:
- **[kb/security/security-monitoring](../security/security-monitoring)** - Security metrics

## 📊 Resource Requirements

**Uptime Kuma**:
- **Minimal**: 256MB RAM, 1 CPU `[██░░░░░░░░]` 20%

**Netdata**:
- **Per Host**: 100-200MB RAM `[██░░░░░░░░]` 20%

**Prometheus**:
- **Small** (10 targets): 1GB RAM, 1 CPU `[███░░░░░░░]` 30%
- **Medium** (50 targets): 2GB RAM, 2 CPU `[█████░░░░░]` 50%
- **Large** (200+ targets): 4GB+ RAM, 4 CPU `[████████░░]` 80%

**Grafana**:
- **Minimal**: 512MB RAM, 1 CPU `[███░░░░░░░]` 30%
- **Comfortable**: 1GB RAM, 2 CPU `[████░░░░░░]` 40%

**Loki Stack**:
- **Small**: 2GB RAM, 2 CPU `[█████░░░░░]` 50%
- **Medium**: 4GB RAM, 4 CPU `[███████░░░]` 70%
- **Large**: 8GB+ RAM, 6+ CPU `[█████████░]` 90%

**Complete Stack** (Prom + Grafana + Loki):
- **Homelab**: 4-6GB RAM `[██████░░░░]` 60%
- **Small Production**: 8-12GB RAM `[████████░░]` 80%
- **Medium Production**: 16-32GB RAM `[█████████░]` 90%

**Learning Time Investment**:
- **Basic Monitoring**: 1 week `[███░░░░░░░]` 30%
- **Prometheus & Grafana**: 2-3 weeks `[█████░░░░░]` 50%
- **Logging**: 2 weeks `[████░░░░░░]` 40%
- **Advanced**: 1-2 months `[███████░░░]` 70%
- **Production Mastery**: 6-12 months `[██████████]` 100%

## 🛠️ Recommended Tool Stack

**Monitoring Stack** (The Big 3):
- **Prometheus** `[██████████]` Required - Metrics
- **Grafana** `[██████████]` Required - Dashboards
- **Loki** `[█████████░]` 90% - Logs

**Supporting Tools**:
- **Uptime Kuma** `[████████░░]` 80% - Uptime checks
- **Netdata** `[████████░░]` 80% - Real-time metrics
- **Alertmanager** `[████████░░]` 80% - Alert routing
- **Jaeger** `[██████░░░░]` 60% - Distributed tracing

**Exporters** (Essential):
- **Node Exporter** `[██████████]` Required - System metrics
- **cAdvisor** `[████████░░]` 80% - Container metrics
- **Blackbox Exporter** `[███████░░░]` 70% - Endpoint checks

**Alternatives**:
- **Victoria Metrics** `[███████░░░]` 70% - Prometheus alternative
- **Mimir** `[██████░░░░]` 60% - Scalable Prometheus
- **Elasticsearch** `[█████░░░░░]` 50% - vs Loki (heavier)

## 💡 Pro Tips for Observability

1. **Start Simple**: Uptime first, metrics second, logs third
2. **Monitor What Matters**: Not everything needs monitoring
3. **Alert on Symptoms**: Not causes - user impact first
4. **Reduce Alert Fatigue**: If it doesn't need action, don't alert
5. **Use Labels Wisely**: Cardinality explosion kills Prometheus
6. **Dashboard Hierarchy**: Overview → Service → Details
7. **Document Dashboards**: What each panel means
8. **Test Alerts**: Trigger them intentionally
9. **Practice Runbooks**: Step-by-step response procedures
10. **Continuous Improvement**: Review alerts monthly

## 🔄 Common Observability Pitfalls

**Pitfall 1: Monitoring Everything**
- High cardinality metrics, storage explosion
- **Fix**: Monitor what matters, sample appropriately

**Pitfall 2: Alert Spam**
- Too many alerts, ignoring all
- **Fix**: Alert on user impact, aggregate noisy alerts

**Pitfall 3: No Baselines**
- Don't know what "normal" looks like
- **Fix**: Establish baselines, understand patterns

**Pitfall 4: Dashboards Without Context**
- Graphs without explanation
- **Fix**: Add descriptions, thresholds, runbook links

**Pitfall 5: Ignoring Logs**
- Only metrics, no context when debugging
- **Fix**: Centralized logging, correlate with metrics

**Pitfall 6: No Retention Policy**
- Storing everything forever
- **Fix**: Define retention, aggregate old data

**Pitfall 7: Single Point of Failure**
- Monitoring goes down with the system
- **Fix**: External monitoring, HA setup

**Pitfall 8: Not Testing Monitoring**
- Broken alerts discovered during incident
- **Fix**: Regular testing, chaos engineering

## 🔗 Related KB Sections

- **[kb/containers/](../containers/)** - Container monitoring
- **[kb/infrastructure/](../infrastructure/)** - IaC for monitoring
- **[kb/cicd/](../cicd/)** - Pipeline monitoring
- **[kb/security/](../security/)** - Security monitoring
- **[kb/sysadmin/](../sysadmin/)** - System performance

## 📝 Change Log

### 2026-01-30
- Created observability directory structure
- Defined complete learning path from uptime to distributed tracing
- Established Prometheus + Grafana + Loki as core stack
- Listed all planned articles with time estimates
- Added resource requirements for monitoring tools
- Emphasized self-hosted, cost-effective approach
- Organized by learning phases (1-5)
- Added tool recommendations and alternatives
- Cross-referenced related KB sections
- Included production observability patterns

---

**📊 Remember**: You can't fix what you can't see! Observability transforms firefighting into proactive management. Start with simple uptime checks, add Prometheus + Grafana for metrics, then Loki for logs. Build observability into every system from day one!

