# Cloud Cost Optimization

## Prerequisites

- Active cloud account (AWS, Azure, or GCP)
- Terraform or cloud CLI tools installed
- Basic understanding of cloud services (EC2, S3, RDS, etc.)
- Access to billing and cost management tools
- **Recommended**: Complete [Terraform basics](../infrastructure/terraform-basics)

## Summary

This guide covers cloud cost optimization strategies to reduce infrastructure spending without sacrificing performance or reliability. You'll learn how to analyze costs, rightsize resources, leverage pricing models, implement cost allocation, and automate optimization.

Cloud bills can spiral out of control without proper monitoring and optimization. A $500/month infrastructure can easily grow to $5,000/month through neglect, over-provisioning, or unmanaged growth. This guide provides practical techniques to keep costs under control while maintaining service quality.

## What You'll Learn

- [ ] Analyze cloud spending with cost management tools
- [ ] Rightsize EC2 instances based on actual utilization
- [ ] Choose optimal pricing models (on-demand, reserved, spot)
- [ ] Implement cost allocation tags for chargeback
- [ ] Set up budget alerts and anomaly detection
- [ ] Optimize storage costs with lifecycle policies
- [ ] Clean up unused and idle resources automatically
- [ ] Estimate infrastructure costs before deployment
- [ ] Build cost-aware architecture patterns
- [ ] Create cost optimization culture in your team

---

## Understanding Cloud Costs

### Cost Components

Cloud bills consist of several categories:

**Compute Costs** (typically 40-60% of total):
- EC2 instances, Lambda functions, containers
- Charged by instance type, hours running, data transfer
- Example: `t3.medium` in `us-east-1` = $0.0416/hour = ~$30/month

**Storage Costs** (typically 15-25%):
- EBS volumes, S3 buckets, RDS storage
- Charged by GB/month, I/O operations, data transfer
- Example: 100 GB EBS gp3 = $8/month, S3 Standard = $2.30/month

**Network Costs** (typically 10-20%):
- Data transfer out to internet
- Cross-region/cross-AZ traffic
- NAT Gateway data processing
- Example: 1 TB out to internet = $90, NAT Gateway = $45 + $0.045/GB

**Database Costs** (typically 10-20%):
- RDS instances, DynamoDB capacity
- Backups, snapshots, read replicas
- Example: `db.t3.medium` Multi-AZ = $120/month

**Other Services** (typically 5-15%):
- Load balancers, Route53, CloudWatch logs
- Backups, snapshots, AMIs
- Support plans

### Common Cost Pitfalls

**Over-Provisioning**:
```
Problem: Launching t3.2xlarge (8 vCPU, 32 GB RAM) for app using 1 vCPU, 2 GB
Cost: $301/month when t3.small ($15/month) sufficient
Waste: $286/month = $3,432/year per instance
```

**Idle Resources**:
```
Problem: Development instances running 24/7 instead of business hours only
Cost: $720/month for instance running 730 hours
Optimized: $180/month for 12 hours/day × 20 days = 240 hours
Savings: $540/month = $6,480/year
```

**Storage Accumulation**:
```
Problem: Keeping all logs in S3 Standard forever
Cost: 10 TB × $23/TB = $230/month
Optimized: 1 month Standard, 1 year Glacier, 2 year deletion = $50/month
Savings: $180/month = $2,160/year
```

**Forgotten Resources**:
```
Problem: Unattached EBS volumes, old snapshots, unused Elastic IPs
Typical Findings: 20 unattached 100 GB volumes = $160/month waste
```

**Data Transfer Costs**:
```
Problem: Pulling large files from S3 to internet repeatedly
Cost: 5 TB/month out = $450/month
Optimized: CloudFront CDN = $200/month + caching reduces origin requests
Savings: $250/month = $3,000/year
```

---

## Cost Analysis Tools

### AWS Cost Explorer

Web-based tool for analyzing AWS spending:

**Enable Cost Explorer**:
```bash
# Via CLI (requires billing access)
aws ce get-cost-and-usage \
  --time-period Start=2026-01-01,End=2026-01-31 \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

**Console Access**:
1. Navigate to AWS Billing → Cost Explorer
2. View monthly costs by service
3. Filter by linked account, region, or tags
4. Compare current vs previous month

**Common Queries**:

View top 10 services by cost:
```bash
aws ce get-cost-and-usage \
  --time-period Start=2026-01-01,End=2026-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --filter file://filter.json
```

Example output:
```json
{
  "ResultsByTime": [{
    "TimePeriod": {"Start": "2026-01-01", "End": "2026-01-31"},
    "Groups": [
      {"Keys": ["Amazon EC2"], "Metrics": {"BlendedCost": {"Amount": "1234.56"}}},
      {"Keys": ["Amazon RDS"], "Metrics": {"BlendedCost": {"Amount": "567.89"}}},
      {"Keys": ["Amazon S3"], "Metrics": {"BlendedCost": {"Amount": "123.45"}}}
    ]
  }]
}
```

**Cost Anomaly Detection**:

AWS automatically detects unusual spending patterns:

```bash
# Create anomaly monitor
aws ce create-anomaly-monitor \
  --anomaly-monitor file://monitor.json

# monitor.json
{
  "MonitorName": "Production Services",
  "MonitorType": "DIMENSIONAL",
  "MonitorDimension": "SERVICE"
}

# Create anomaly subscription for alerts
aws ce create-anomaly-subscription \
  --anomaly-subscription file://subscription.json

# subscription.json
{
  "SubscriptionName": "Cost Alert",
  "Threshold": 100.0,
  "Frequency": "DAILY",
  "MonitorArnList": ["arn:aws:ce::123456789012:anomalymonitor/abc123"],
  "Subscribers": [{
    "Type": "EMAIL",
    "Address": "devops@example.com"
  }]
}
```

Alerts trigger when spending exceeds expected amount by $100+.

### AWS Cost and Usage Reports (CUR)

Most detailed billing data, stored in S3:

**Enable CUR**:
```hcl
# Terraform
resource "aws_cur_report_definition" "main" {
  report_name                = "hourly-cost-report"
  time_unit                  = "HOURLY"
  format                     = "Parquet"
  compression                = "Parquet"
  s3_bucket                  = aws_s3_bucket.billing.id
  s3_region                  = "us-east-1"
  s3_prefix                  = "cur"
  additional_schema_elements = ["RESOURCES"]
  report_versioning          = "OVERWRITE_REPORT"
  
  additional_artifacts = ["ATHENA"]
}

resource "aws_s3_bucket" "billing" {
  bucket = "my-company-billing-reports"
}
```

**Query with Athena**:
```sql
-- Top 10 resources by cost this month
SELECT 
  line_item_resource_id,
  line_item_product_code,
  SUM(line_item_blended_cost) as cost
FROM cost_and_usage_report
WHERE year = '2026' AND month = '01'
GROUP BY line_item_resource_id, line_item_product_code
ORDER BY cost DESC
LIMIT 10;

-- Daily spending trend
SELECT 
  line_item_usage_start_date as date,
  SUM(line_item_blended_cost) as daily_cost
FROM cost_and_usage_report
WHERE year = '2026' AND month = '01'
GROUP BY line_item_usage_start_date
ORDER BY date;

-- Unused resources (no usage in last 7 days)
SELECT 
  line_item_resource_id,
  MAX(line_item_usage_end_date) as last_used,
  SUM(line_item_blended_cost) as cost
FROM cost_and_usage_report
WHERE year = '2026'
GROUP BY line_item_resource_id
HAVING MAX(line_item_usage_end_date) < DATE_ADD('day', -7, CURRENT_DATE);
```

### Azure Cost Management

Similar capabilities for Azure:

```bash
# View costs by resource group
az consumption usage list \
  --start-date 2026-01-01 \
  --end-date 2026-01-31 \
  --query "[].{Name:instanceName,Cost:pretaxCost}" \
  --output table

# Create budget with alert
az consumption budget create \
  --budget-name production-monthly \
  --amount 5000 \
  --time-grain Monthly \
  --start-date 2026-01-01 \
  --end-date 2026-12-31 \
  --notifications \
    actual=80 \
    contactEmails="devops@example.com" \
    contactRoles="Owner"
```

### GCP Cost Management

```bash
# View costs by project
gcloud billing accounts list
gcloud billing projects describe PROJECT_ID

# Export to BigQuery for analysis
gcloud billing accounts export-to-bigquery \
  --billing-account=ACCOUNT_ID \
  --dataset-id=billing_export \
  --location=US
```

Query in BigQuery:
```sql
SELECT 
  service.description as service,
  SUM(cost) as total_cost
FROM `project.billing_export.gcp_billing_export_v1_*`
WHERE _TABLE_SUFFIX BETWEEN '20260101' AND '20260131'
GROUP BY service
ORDER BY total_cost DESC;
```

---

## Rightsizing Resources

### EC2 Instance Rightsizing

Matching instance size to actual utilization:

**AWS Compute Optimizer**:

Analyzes CloudWatch metrics (CPU, memory, network) and recommends optimal instance types:

```bash
# Get recommendations for all instances
aws compute-optimizer get-ec2-instance-recommendations \
  --region us-east-1 \
  --output json

# Example output
{
  "instanceRecommendations": [{
    "instanceArn": "arn:aws:ec2:us-east-1:123:instance/i-abc123",
    "currentInstanceType": "t3.large",
    "finding": "OVER_PROVISIONED",
    "recommendationOptions": [{
      "instanceType": "t3.medium",
      "projectedUtilizationMetrics": [{
        "name": "CPU",
        "statistic": "MAXIMUM",
        "value": 45.2
      }],
      "estimatedMonthlySavings": {
        "currency": "USD",
        "value": 30.24
      }
    }]
  }]
}
```

**Manual Analysis with CloudWatch**:

```bash
# Get average CPU utilization over 30 days
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --dimensions Name=InstanceId,Value=i-abc123 \
  --start-time 2025-12-31T00:00:00Z \
  --end-time 2026-01-30T23:59:59Z \
  --period 86400 \
  --statistics Average Maximum

# If average <20% and max <40%, instance over-provisioned
# If average >60% and max >90%, instance under-provisioned
```

**Rightsizing Decision Matrix**:

```
CPU Avg < 20%, Max < 40%:  Downsize 1-2 levels (t3.large → t3.medium)
CPU Avg 20-60%, Max 40-80%: Current size appropriate
CPU Avg > 60%, Max > 80%:   Upsize 1 level or add horizontal scaling

Memory > 80% sustained:     Upsize to more memory
Memory < 30% sustained:     Downsize to less memory

Network consistently maxed: Upsize to instance with better network
```

**Automated Rightsizing with Terraform**:

```hcl
# Use Compute Optimizer recommendations in Terraform
data "aws_ec2_instance_type_offerings" "recommended" {
  filter {
    name   = "instance-type"
    values = ["t3.medium", "t3.large", "t3.xlarge"]
  }
  filter {
    name   = "location"
    values = ["us-east-1a"]
  }
}

resource "aws_instance" "app" {
  # Start with t3.medium, monitor, adjust
  instance_type = var.instance_type  # Pass from variable
  ami           = data.aws_ami.amazon_linux_2.id
  
  tags = {
    Name        = "app-server"
    Environment = "production"
    # Track for cost analysis
    CostCenter  = "engineering"
  }
}

# Create CloudWatch alarm to detect under-provisioning
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "app-server-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "CPU consistently high - consider upsizing"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    InstanceId = aws_instance.app.id
  }
}
```

**Gradual Rightsizing Process**:

1. **Identify candidates**: Compute Optimizer or manual CloudWatch analysis
2. **Test in staging**: Change instance type, load test
3. **Monitor**: Watch CPU, memory, response time for 1 week
4. **Production during maintenance window**: 
   ```bash
   # Stop instance
   aws ec2 stop-instances --instance-ids i-abc123
   
   # Wait until stopped
   aws ec2 wait instance-stopped --instance-ids i-abc123
   
   # Change instance type
   aws ec2 modify-instance-attribute \
     --instance-id i-abc123 \
     --instance-type t3.medium
   
   # Start instance
   aws ec2 start-instances --instance-ids i-abc123
   ```
5. **Validate**: Check application health, monitor metrics
6. **Document savings**: Track cost reduction

**Expected Savings**:
```
t3.large → t3.medium: $60/month → $30/month = $30/month saved
10 instances = $300/month = $3,600/year

t3.2xlarge → t3.xlarge: $301/month → $150/month = $151/month saved
5 instances = $755/month = $9,060/year
```

### RDS Instance Rightsizing

Similar approach for databases:

```bash
# Get RDS recommendations
aws compute-optimizer get-rds-recommendations \
  --region us-east-1

# Check database CPU and connections
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=mydb \
  --start-time 2025-12-31T00:00:00Z \
  --end-time 2026-01-30T23:59:59Z \
  --period 86400 \
  --statistics Average Maximum

aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=mydb \
  --start-time 2025-12-31T00:00:00Z \
  --end-time 2026-01-30T23:59:59Z \
  --period 86400 \
  --statistics Average Maximum
```

**Rightsizing RDS**:
```bash
# Create snapshot first (safety)
aws rds create-db-snapshot \
  --db-instance-identifier mydb \
  --db-snapshot-identifier mydb-before-downsize

# Modify instance class
aws rds modify-db-instance \
  --db-instance-identifier mydb \
  --db-instance-class db.t3.medium \
  --apply-immediately  # Or during maintenance window
```

---

## Pricing Models

### On-Demand vs Reserved vs Spot

**On-Demand Pricing**:
- Pay per hour/second with no commitment
- Most expensive, most flexible
- Best for: Short-term, spiky workloads, testing

Example: `t3.medium` = $0.0416/hour = $30.37/month

**Reserved Instances** (1-year or 3-year commitment):
- 30-60% discount vs on-demand
- Payment options: All Upfront, Partial Upfront, No Upfront
- Best for: Steady-state workloads

```
t3.medium On-Demand:  $0.0416/hour = $304/year
t3.medium 1-Year Reserved (No Upfront): $0.0277/hour = $202/year (34% savings)
t3.medium 3-Year Reserved (All Upfront): $0.0190/hour = $139/year (54% savings)
```

**Purchase Reserved Instances**:
```bash
# Find available RIs
aws ec2 describe-reserved-instances-offerings \
  --instance-type t3.medium \
  --product-description "Linux/UNIX" \
  --query "ReservedInstancesOfferings[0:5].[ReservedInstancesOfferingId,InstanceType,OfferingClass,Duration,FixedPrice,UsagePrice]" \
  --output table

# Purchase RI
aws ec2 purchase-reserved-instances-offering \
  --reserved-instances-offering-id abc-123-def \
  --instance-count 5
```

**Terraform for Reserved Instances**:
```hcl
# Note: Terraform doesn't directly manage RIs
# Instead, use consistent tagging to identify RI candidates
resource "aws_instance" "app" {
  instance_type = "t3.medium"
  
  tags = {
    Name       = "app-server-${count.index}"
    Workload   = "steady-state"  # Candidate for RI
    Team       = "backend"
  }
  
  count = 5
}

# Run external script to purchase RIs matching tags
# aws ec2 describe-instances --filters "Name=tag:Workload,Values=steady-state"
# then purchase RIs for those instance types
```

**Spot Instances** (up to 90% discount):
- Spare AWS capacity, can be interrupted with 2-minute warning
- Best for: Batch jobs, CI/CD, stateless workloads, fault-tolerant apps

```
t3.medium On-Demand: $0.0416/hour
t3.medium Spot:      $0.0125/hour average (70% savings)
```

**Using Spot Instances**:
```hcl
# Terraform spot instance
resource "aws_spot_instance_request" "batch_worker" {
  ami           = data.aws_ami.amazon_linux_2.id
  instance_type = "t3.medium"
  spot_price    = "0.025"  # Max price willing to pay
  
  spot_type            = "one-time"  # Or "persistent"
  wait_for_fulfillment = true
  
  user_data = <<-EOF
    #!/bin/bash
    # Handle spot interruption
    TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
    while true; do
      HTTP_CODE=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" -s -w %{http_code} -o /dev/null http://169.254.169.254/latest/meta-data/spot/instance-action)
      if [ "$HTTP_CODE" = "200" ]; then
        echo "Spot instance terminating soon - graceful shutdown"
        # Save work, upload results, exit cleanly
        exit 0
      fi
      sleep 5
    done
  EOF
  
  tags = {
    Name = "batch-worker-spot"
  }
}

# Kubernetes with spot instances
resource "aws_eks_node_group" "spot" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "spot-workers"
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = aws_subnet.private[*].id
  
  scaling_config {
    desired_size = 3
    max_size     = 10
    min_size     = 1
  }
  
  capacity_type = "SPOT"  # Use spot instances
  instance_types = ["t3.medium", "t3a.medium", "t2.medium"]  # Multiple types increase availability
  
  labels = {
    workload = "batch"
  }
  
  taints {
    key    = "spot"
    value  = "true"
    effect = "NoSchedule"  # Only schedule pods that tolerate spot
  }
}
```

**Decision Matrix**:

```
Workload Type                          | Recommended Pricing
---------------------------------------|---------------------
Production web servers (24/7)          | Reserved Instance 1-3 year
Development/staging (business hours)   | On-Demand with scheduler
Batch processing, CI/CD                | Spot Instances
Short-term projects (<3 months)        | On-Demand
ML training (can checkpoint)           | Spot Instances
Database (critical, 24/7)              | Reserved Instance 3-year
```

**Hybrid Approach**:

Optimal cost: Combine all three pricing models

```hcl
# Production: Mix of reserved + on-demand
# 70% coverage with reserved for baseline load
# 30% on-demand for scaling beyond baseline

resource "aws_autoscaling_group" "app" {
  name                = "app-asg"
  min_size            = 5   # Covered by reserved instances
  max_size            = 15  # Scale with on-demand when needed
  desired_capacity    = 5
  
  mixed_instances_policy {
    launch_template {
      launch_template_specification {
        launch_template_id = aws_launch_template.app.id
        version            = "$Latest"
      }
    }
    
    instances_distribution {
      on_demand_base_capacity                  = 5   # Always 5 on-demand (use RIs)
      on_demand_percentage_above_base_capacity = 0   # Scale with spot
      spot_allocation_strategy                 = "lowest-price"
      spot_instance_pools                      = 3
    }
  }
}
```

Expected savings:
```
10 instances, all on-demand:     10 × $304/year = $3,040/year
5 RIs (3-year) + 5 on-demand:    (5 × $139) + (5 × $304) = $2,215/year
5 RIs + 5 spot (when running):   (5 × $139) + (5 × $91) = $1,150/year

Savings: $3,040 - $1,150 = $1,890/year (62% reduction)
```

---

## Cost Allocation and Chargeback

### Tagging Strategy

Consistent tags enable cost tracking by team, environment, project:

**Required Tags**:
```hcl
locals {
  common_tags = {
    Environment = "production"  # production, staging, development
    Team        = "backend"     # backend, frontend, data, devops
    Project     = "api-v2"      # project or product name
    CostCenter  = "engineering" # business unit for chargeback
    ManagedBy   = "terraform"   # how resource provisioned
    Owner       = "john@example.com"
  }
}

resource "aws_instance" "app" {
  instance_type = "t3.medium"
  ami           = data.aws_ami.amazon_linux_2.id
  
  tags = merge(local.common_tags, {
    Name = "app-server-01"
  })
}

resource "aws_ebs_volume" "data" {
  availability_zone = "us-east-1a"
  size              = 100
  
  tags = merge(local.common_tags, {
    Name = "app-data-volume"
  })
}
```

**Enforce Tagging with AWS Config**:

```hcl
# Require specific tags on all resources
resource "aws_config_config_rule" "required_tags" {
  name = "required-tags"
  
  source {
    owner             = "AWS"
    source_identifier = "REQUIRED_TAGS"
  }
  
  input_parameters = jsonencode({
    tag1Key = "Environment"
    tag2Key = "Team"
    tag3Key = "CostCenter"
  })
  
  depends_on = [aws_config_configuration_recorder.main]
}

# Auto-remediate missing tags
resource "aws_config_remediation_configuration" "add_default_tags" {
  config_rule_name = aws_config_config_rule.required_tags.name
  resource_type    = "AWS::EC2::Instance"
  
  target_type      = "SSM_DOCUMENT"
  target_identifier = "AWS-PublishSNSNotification"
  
  parameter {
    name         = "Message"
    static_value = "Resource missing required tags"
  }
}
```

**Tag-Based Billing Reports**:

```bash
# Cost by team
aws ce get-cost-and-usage \
  --time-period Start=2026-01-01,End=2026-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=TAG,Key=Team

# Cost by environment
aws ce get-cost-and-usage \
  --time-period Start=2026-01-01,End=2026-01-31 \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=TAG,Key=Environment
```

**Chargeback Report**:

Query cost by cost center for internal billing:

```sql
-- Athena query on CUR data
SELECT 
  resource_tags_user_cost_center as cost_center,
  resource_tags_user_team as team,
  SUM(line_item_blended_cost) as total_cost
FROM cost_and_usage_report
WHERE year = '2026' AND month = '01'
GROUP BY resource_tags_user_cost_center, resource_tags_user_team
ORDER BY total_cost DESC;

-- Output:
-- cost_center    | team      | total_cost
-- engineering    | backend   | 1234.56
-- engineering    | frontend  | 567.89
-- data-platform  | analytics | 890.12
```

**Tag Compliance Dashboard**:

```python
# Check tag compliance across all resources
import boto3

ec2 = boto3.client('ec2')
required_tags = ['Environment', 'Team', 'CostCenter']

# Get all instances
instances = ec2.describe_instances()

for reservation in instances['Reservations']:
    for instance in reservation['Instances']:
        instance_id = instance['InstanceId']
        tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
        
        missing_tags = [tag for tag in required_tags if tag not in tags]
        
        if missing_tags:
            print(f"Instance {instance_id} missing tags: {missing_tags}")
            # Option: Add default tags
            # ec2.create_tags(
            #     Resources=[instance_id],
            #     Tags=[{'Key': tag, 'Value': 'unassigned'} for tag in missing_tags]
            # )
```

---

## Budget Alerts and Monitoring

### AWS Budgets

Set spending limits and receive alerts:

```hcl
# Terraform budget
resource "aws_budgets_budget" "monthly_cost" {
  name              = "monthly-cost-budget"
  budget_type       = "COST"
  limit_amount      = "5000"
  limit_unit        = "USD"
  time_unit         = "MONTHLY"
  time_period_start = "2026-01-01_00:00"
  
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = ["devops@example.com"]
  }
  
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = ["cto@example.com"]
  }
  
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 90
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"  # Alert if forecast exceeds
    subscriber_email_addresses = ["devops@example.com"]
  }
}

# Budget for specific service
resource "aws_budgets_budget" "ec2_cost" {
  name         = "ec2-monthly-budget"
  budget_type  = "COST"
  limit_amount = "2000"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"
  
  cost_filters = {
    Service = "Amazon Elastic Compute Cloud - Compute"
  }
  
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 90
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = ["devops@example.com"]
  }
}

# Budget by team (using cost allocation tags)
resource "aws_budgets_budget" "backend_team" {
  name         = "backend-team-budget"
  budget_type  = "COST"
  limit_amount = "1500"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"
  
  cost_filters = {
    TagKeyValue = "Team$backend"
  }
  
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 75
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = ["backend-team@example.com"]
  }
}
```

**CLI Budget Creation**:
```bash
# Create budget
aws budgets create-budget \
  --account-id 123456789012 \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json

# budget.json
{
  "BudgetName": "Monthly Cost Budget",
  "BudgetLimit": {
    "Amount": "5000",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}

# notifications.json
[{
  "Notification": {
    "NotificationType": "ACTUAL",
    "ComparisonOperator": "GREATER_THAN",
    "Threshold": 80,
    "ThresholdType": "PERCENTAGE"
  },
  "Subscribers": [{
    "SubscriptionType": "EMAIL",
    "Address": "devops@example.com"
  }]
}]
```

### Cost Anomaly Detection

AWS automatically detects unusual spending:

```hcl
resource "aws_ce_anomaly_monitor" "service_monitor" {
  name              = "ServiceMonitor"
  monitor_type      = "DIMENSIONAL"
  monitor_dimension = "SERVICE"
}

resource "aws_ce_anomaly_subscription" "cost_alerts" {
  name      = "Cost Anomaly Alerts"
  frequency = "DAILY"
  
  threshold_expression {
    dimension {
      key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
      values        = ["100"]  # Alert if anomaly >$100
      match_options = ["GREATER_THAN_OR_EQUAL"]
    }
  }
  
  monitor_arn_list = [
    aws_ce_anomaly_monitor.service_monitor.arn
  ]
  
  subscriber {
    type    = "EMAIL"
    address = "devops@example.com"
  }
}
```

Example alert:
```
Subject: AWS Cost Anomaly Detected

An unusual increase in spending was detected:
- Service: Amazon EC2
- Date: January 15, 2026
- Expected Cost: $150
- Actual Cost: $400
- Impact: +$250 (166% increase)

Possible causes:
- New instances launched
- Instance type changed
- Increased data transfer
```

### Daily Cost Reports

Automate daily cost summaries:

```python
# Lambda function for daily cost report
import boto3
import json
from datetime import datetime, timedelta

ce = boto3.client('ce')
sns = boto3.client('sns')

def lambda_handler(event, context):
    # Get yesterday's cost
    end = datetime.now().date()
    start = end - timedelta(days=1)
    
    response = ce.get_cost_and_usage(
        TimePeriod={
            'Start': str(start),
            'End': str(end)
        },
        Granularity='DAILY',
        Metrics=['BlendedCost'],
        GroupBy=[{'Type': 'SERVICE', 'Key': 'SERVICE'}]
    )
    
    # Parse results
    costs = []
    total = 0
    for result in response['ResultsByTime']:
        for group in result['Groups']:
            service = group['Keys'][0]
            cost = float(group['Metrics']['BlendedCost']['Amount'])
            if cost > 0.01:  # Ignore negligible costs
                costs.append((service, cost))
                total += cost
    
    # Sort by cost descending
    costs.sort(key=lambda x: x[1], reverse=True)
    
    # Format message
    message = f"AWS Cost Report for {start}\n\n"
    message += f"Total: ${total:.2f}\n\n"
    message += "Top Services:\n"
    for service, cost in costs[:10]:
        percentage = (cost / total) * 100
        message += f"  {service}: ${cost:.2f} ({percentage:.1f}%)\n"
    
    # Send to Slack/Email
    sns.publish(
        TopicArn='arn:aws:sns:us-east-1:123456789012:cost-reports',
        Subject=f'Daily AWS Cost Report - ${total:.2f}',
        Message=message
    )
    
    return {'statusCode': 200, 'body': json.dumps('Report sent')}
```

Deploy with Terraform:
```hcl
resource "aws_lambda_function" "daily_cost_report" {
  filename      = "cost_report.zip"
  function_name = "daily-cost-report"
  role          = aws_iam_role.lambda.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.11"
  timeout       = 60
}

resource "aws_cloudwatch_event_rule" "daily" {
  name                = "daily-cost-report"
  schedule_expression = "cron(0 8 * * ? *)"  # 8 AM UTC daily
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.daily.name
  target_id = "DailyCostReport"
  arn       = aws_lambda_function.daily_cost_report.arn
}
```

---

## Storage Optimization

### S3 Lifecycle Policies

Automatically transition objects to cheaper storage classes:

**Storage Classes Comparison**:
```
S3 Standard:           $0.023/GB/month - Frequent access
S3 Intelligent-Tiering: $0.023/GB/month - Auto-optimization
S3 Standard-IA:        $0.0125/GB/month - Infrequent access (>30 days)
S3 One Zone-IA:        $0.01/GB/month - Infrequent, single AZ
S3 Glacier Instant:    $0.004/GB/month - Archive, instant retrieval
S3 Glacier Flexible:   $0.0036/GB/month - Archive, 1-5 min retrieval
S3 Glacier Deep:       $0.00099/GB/month - Archive, 12 hour retrieval
```

**Lifecycle Policy Example**:

```hcl
resource "aws_s3_bucket" "logs" {
  bucket = "application-logs-bucket"
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  
  rule {
    id     = "log-retention"
    status = "Enabled"
    
    # Transition to IA after 30 days
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    
    # Transition to Glacier after 90 days
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    
    # Delete after 2 years
    expiration {
      days = 730
    }
  }
  
  rule {
    id     = "delete-incomplete-multipart"
    status = "Enabled"
    
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}
```

**Intelligent Tiering** (automatic optimization):

```hcl
resource "aws_s3_bucket" "data" {
  bucket = "data-warehouse-bucket"
}

resource "aws_s3_bucket_lifecycle_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  
  rule {
    id     = "intelligent-tiering"
    status = "Enabled"
    
    transition {
      days          = 0  # Immediate
      storage_class = "INTELLIGENT_TIERING"
    }
  }
}

# Automatically moves objects:
# - Frequent Access tier (accessed within 30 days)
# - Infrequent Access tier (not accessed 30+ days) - saves 40%
# - Archive Instant Access (not accessed 90+ days) - saves 68%
# - Archive Access (not accessed 180+ days) - saves 71%
# - Deep Archive (not accessed 270+ days) - saves 95%
```

**Cost Savings Example**:

```
1 TB application logs, kept 2 years:

Without lifecycle:
1024 GB × $0.023/GB/month × 24 months = $565

With lifecycle (30 days Standard, 60 days IA, 22 months Glacier):
(1024 × $0.023 × 1) + (1024 × $0.0125 × 2) + (1024 × $0.004 × 21) = $135

Savings: $430 (76% reduction)
```

### EBS Volume Optimization

**Delete Unattached Volumes**:

```bash
# Find unattached volumes
aws ec2 describe-volumes \
  --filters Name=status,Values=available \
  --query 'Volumes[*].[VolumeId,Size,VolumeType,CreateTime]' \
  --output table

# Example output:
# vol-abc123  100 GB  gp3  2025-06-01  (unattached for 8 months)
# vol-def456   50 GB  gp2  2025-12-15  (unattached for 1 month)

# Delete after verification
aws ec2 delete-volume --volume-id vol-abc123

# Automated cleanup script
aws ec2 describe-volumes \
  --filters Name=status,Values=available \
  --query 'Volumes[?CreateTime<=`2025-09-01`].[VolumeId]' \
  --output text | while read volume; do
  echo "Deleting old unattached volume: $volume"
  aws ec2 delete-volume --volume-id $volume
done
```

**Downgrade gp3 Volumes**:

gp3 cheaper than gp2 with same performance:
```
100 GB gp2: $10/month
100 GB gp3: $8/month (20% savings)
```

```bash
# Convert gp2 to gp3
aws ec2 modify-volume \
  --volume-id vol-abc123 \
  --volume-type gp3

# Reduce provisioned IOPS if over-provisioned
aws ec2 modify-volume \
  --volume-id vol-abc123 \
  --iops 3000  # Default 3000, max 16000
```

**Snapshot Cleanup**:

Old snapshots accumulate costs:

```bash
# Find snapshots older than 90 days
aws ec2 describe-snapshots \
  --owner-ids self \
  --query "Snapshots[?StartTime<='2025-11-01'].[SnapshotId,StartTime,VolumeSize]" \
  --output table

# Delete old snapshots
aws ec2 delete-snapshot --snapshot-id snap-abc123

# Automated cleanup
aws ec2 describe-snapshots --owner-ids self \
  --query "Snapshots[?StartTime<='2025-11-01'].SnapshotId" \
  --output text | while read snapshot; do
  echo "Deleting old snapshot: $snapshot"
  aws ec2 delete-snapshot --snapshot-id $snapshot
done
```

**Lifecycle Manager for Automated Snapshots**:

```hcl
resource "aws_dlm_lifecycle_policy" "ebs_snapshots" {
  description        = "EBS snapshot policy"
  execution_role_arn = aws_iam_role.dlm.arn
  state              = "ENABLED"
  
  policy_details {
    resource_types = ["VOLUME"]
    
    schedule {
      name = "Daily snapshots"
      
      create_rule {
        interval      = 24
        interval_unit = "HOURS"
        times         = ["03:00"]
      }
      
      retain_rule {
        count = 7  # Keep only 7 days of snapshots
      }
      
      tags_to_add = {
        ManagedBy = "DLM"
      }
      
      copy_tags = true
    }
    
    target_tags = {
      Backup = "true"
    }
  }
}
```

---

## Unused Resource Cleanup

### Elastic IPs

Unattached Elastic IPs cost $0.005/hour = $3.60/month each:

```bash
# Find unassociated Elastic IPs
aws ec2 describe-addresses \
  --query 'Addresses[?AssociationId==`null`].[PublicIp,AllocationId]' \
  --output table

# Release EIP
aws ec2 release-address --allocation-id eipalloc-abc123

# Automated cleanup
aws ec2 describe-addresses \
  --query 'Addresses[?AssociationId==`null`].AllocationId' \
  --output text | while read eip; do
  echo "Releasing unassociated EIP: $eip"
  aws ec2 release-address --allocation-id $eip
done
```

### Load Balancers

Idle load balancers cost $16-$23/month each:

```bash
# Find ALBs with no targets
aws elbv2 describe-load-balancers \
  --query 'LoadBalancers[*].[LoadBalancerName,LoadBalancerArn]' \
  --output text | while read name arn; do
  
  # Get target groups
  target_groups=$(aws elbv2 describe-target-groups \
    --load-balancer-arn $arn \
    --query 'TargetGroups[*].TargetGroupArn' \
    --output text)
  
  if [ -z "$target_groups" ]; then
    echo "ALB $name has no target groups - consider deletion"
  else
    for tg in $target_groups; do
      targets=$(aws elbv2 describe-target-health \
        --target-group-arn $tg \
        --query 'TargetHealthDescriptions' \
        --output text)
      if [ -z "$targets" ]; then
        echo "ALB $name target group has no targets"
      fi
    done
  fi
done

# Delete unused ALB
aws elbv2 delete-load-balancer --load-balancer-arn $arn
```

### Unused Security Groups

```bash
# Find unused security groups
aws ec2 describe-security-groups --query 'SecurityGroups[*].[GroupId,GroupName]' --output text | while read id name; do
  # Check if attached to any network interface
  attached=$(aws ec2 describe-network-interfaces \
    --filters Name=group-id,Values=$id \
    --query 'NetworkInterfaces[*].NetworkInterfaceId' \
    --output text)
  
  if [ -z "$attached" ] && [ "$name" != "default" ]; then
    echo "Unused security group: $id ($name)"
    # aws ec2 delete-security-group --group-id $id
  fi
done
```

### Old AMIs

```bash
# Find AMIs older than 6 months
aws ec2 describe-images \
  --owners self \
  --query "Images[?CreationDate<='2025-07-01'].[ImageId,Name,CreationDate]" \
  --output table

# Deregister old AMI (also delete associated snapshots)
aws ec2 deregister-image --image-id ami-abc123

# Find snapshots from deregistered AMI
aws ec2 describe-snapshots \
  --owner-ids self \
  --filters Name=description,Values="*ami-abc123*" \
  --query 'Snapshots[*].SnapshotId' \
  --output text | while read snap; do
  aws ec2 delete-snapshot --snapshot-id $snap
done
```

### Automated Cleanup Lambda

```python
# Lambda function to identify unused resources
import boto3
from datetime import datetime, timedelta

ec2 = boto3.client('ec2')
elbv2 = boto3.client('elbv2')
sns = boto3.client('sns')

def lambda_handler(event, context):
    findings = []
    savings = 0
    
    # Unattached EBS volumes
    volumes = ec2.describe_volumes(Filters=[{'Name': 'status', 'Values': ['available']}])
    for vol in volumes['Volumes']:
        age_days = (datetime.now(vol['CreateTime'].tzinfo) - vol['CreateTime']).days
        if age_days > 30:
            size = vol['Size']
            cost = size * 0.08  # gp3 $0.08/GB/month
            findings.append(f"Unattached volume {vol['VolumeId']} ({size} GB) for {age_days} days - ${cost:.2f}/month")
            savings += cost
    
    # Unassociated Elastic IPs
    eips = ec2.describe_addresses()
    for eip in eips['Addresses']:
        if 'AssociationId' not in eip:
            findings.append(f"Unassociated EIP {eip['PublicIp']} - $3.60/month")
            savings += 3.60
    
    # Idle load balancers (no targets)
    lbs = elbv2.describe_load_balancers()
    for lb in lbs['LoadBalancers']:
        tgs = elbv2.describe_target_groups(LoadBalancerArn=lb['LoadBalancerArn'])
        has_targets = False
        for tg in tgs['TargetGroups']:
            targets = elbv2.describe_target_health(TargetGroupArn=tg['TargetGroupArn'])
            if targets['TargetHealthDescriptions']:
                has_targets = True
                break
        if not has_targets:
            findings.append(f"Idle ALB {lb['LoadBalancerName']} - $23/month")
            savings += 23
    
    # Old snapshots
    cutoff = datetime.now() - timedelta(days=180)
    snapshots = ec2.describe_snapshots(OwnerIds=['self'])
    for snap in snapshots['Snapshots']:
        if snap['StartTime'].replace(tzinfo=None) < cutoff:
            cost = snap['VolumeSize'] * 0.05 / 30  # Snapshot storage
            findings.append(f"Old snapshot {snap['SnapshotId']} from {snap['StartTime'].date()} - ${cost:.2f}/month")
            savings += cost
    
    # Send report
    message = f"Unused Resources Report\n\n"
    message += f"Potential monthly savings: ${savings:.2f}\n\n"
    message += "\n".join(findings)
    
    sns.publish(
        TopicArn='arn:aws:sns:us-east-1:123456789012:cost-optimization',
        Subject=f'Unused Resources - ${savings:.2f}/month savings',
        Message=message
    )
    
    return {'statusCode': 200, 'findings': len(findings), 'savings': savings}
```

---

## Infrastructure Cost Estimation

### Infracost

Estimate Terraform costs before deployment:

**Installation**:
```bash
# Linux/macOS
curl -fsSL https://raw.githubusercontent.com/infracost/infracost/master/scripts/install.sh | sh

# Windows
choco install infracost

# Configure API key (free)
infracost auth login
```

**Basic Usage**:
```bash
# Generate cost estimate
cd terraform/
infracost breakdown --path .

# Example output:
# Name                                    Monthly Qty  Unit         Monthly Cost
# aws_instance.app
#  ├─ Instance usage (Linux/UNIX, on-demand, t3.medium)  730  hours        $30.37
#  └─ root_block_device
#     └─ Storage (general purpose SSD, gp3)              50   GB           $4.00
# aws_rds_instance.db
#  ├─ Database instance (on-demand, db.t3.medium)        730  hours        $60.74
#  ├─ Storage (general purpose SSD, gp3)                 100  GB           $11.50
#  └─ Additional backup storage                          100  GB           $9.50
#
# OVERALL TOTAL                                                            $116.11
```

**Compare Changes**:
```bash
# Before making changes
infracost breakdown --path . --format json > baseline.json

# Make Terraform changes (e.g., upsize instance)

# Compare costs
infracost diff --path . --compare-to baseline.json

# Output:
# + aws_instance.app
#   +$60.74 ($30.37 → $91.11)
#   Instance usage changed from t3.medium to t3.large
#
# Monthly cost change: +$60.74
# Percent change: +200%
```

**CI/CD Integration**:

```yaml
# GitHub Actions
name: Infracost
on: [pull_request]

jobs:
  infracost:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Infracost
        uses: infracost/actions/setup@v2
        with:
          api-key: ${{ secrets.INFRACOST_API_KEY }}
      
      - name: Checkout base branch
        uses: actions/checkout@v3
        with:
          ref: '${{ github.event.pull_request.base.ref }}'
      
      - name: Generate baseline cost
        run: |
          infracost breakdown --path=. --format=json --out-file=/tmp/baseline.json
      
      - name: Checkout PR branch
        uses: actions/checkout@v3
      
      - name: Generate PR cost
        run: |
          infracost diff --path=. --compare-to=/tmp/baseline.json --format=json --out-file=/tmp/diff.json
      
      - name: Post comment
        uses: infracost/actions/comment@v1
        with:
          path: /tmp/diff.json
          behavior: update
```

Comments on PR:
```
💰 Infracost estimate: monthly cost will increase by $61 ↑

+ aws_instance.app
  +$60.74 Instance changed from t3.medium to t3.large

Total monthly cost: $177 (was $116)
```

**Policy Enforcement**:

Block PRs that exceed cost threshold:

```yaml
- name: Check cost increase
  run: |
    DIFF=$(jq '.diffTotalMonthlyCost' /tmp/diff.json)
    if (( $(echo "$DIFF > 100" | bc -l) )); then
      echo "Cost increase exceeds $100/month threshold"
      exit 1
    fi
```

---

## Cost-Aware Architecture

### Serverless for Variable Workloads

Avoid paying for idle compute:

**Traditional vs Serverless Cost**:
```
Traditional: t3.medium running 24/7 = $30/month
Handles 10 requests/day averaging 1 second each

Lambda: 300 requests/month × 1 GB × 1 second = $0.0002/month
Savings: $29.98/month (99.9% reduction)
```

**When Serverless Cheaper**:
- Low request volume (<1M requests/month)
- Variable/spiky traffic patterns
- Short execution time (<15 minutes)
- Infrequent batch jobs

**When Traditional Cheaper**:
- High constant load (>30% utilization 24/7)
- Long-running processes (hours)
- Memory-intensive workloads

### Auto Scaling

Pay only for capacity you need:

```hcl
resource "aws_autoscaling_group" "app" {
  min_size         = 2   # Minimum for availability
  max_size         = 10  # Maximum for peak traffic
  desired_capacity = 2   # Start small
  
  # Scale up when CPU >70%
  target_group_arns = [aws_lb_target_group.app.arn]
  
  tag {
    key                 = "Name"
    value               = "app-server"
    propagate_at_launch = true
  }
}

resource "aws_autoscaling_policy" "scale_up" {
  name                   = "scale-up"
  autoscaling_group_name = aws_autoscaling_group.app.name
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = 2
  cooldown               = 300
}

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"
  alarm_actions       = [aws_autoscaling_policy.scale_up.arn]
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }
}

# Scale down when CPU <30%
resource "aws_autoscaling_policy" "scale_down" {
  name                   = "scale-down"
  autoscaling_group_name = aws_autoscaling_group.app.name
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = -1
  cooldown               = 300
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "30"
  alarm_actions       = [aws_autoscaling_policy.scale_down.arn]
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }
}
```

**Cost Impact**:
```
Without auto scaling: 10 instances 24/7 = $304/month × 10 = $3,040/month
With auto scaling: Average 3 instances = $912/month
Savings: $2,128/month (70% reduction)
```

### Multi-Region Architecture

Deploy only where users are:

```
Global application with users 80% US, 15% EU, 5% APAC:

Instead of: 10 instances us-east-1, 10 eu-west-1, 10 ap-southeast-1 = 30 instances
Optimized:  12 instances us-east-1, 3 eu-west-1, 1 ap-southeast-1 = 16 instances

Savings: 14 instances × $30/month = $420/month
```

### Data Transfer Optimization

Most expensive: Cross-region and internet egress

**Cost Comparison**:
```
Within AZ:            Free
Cross-AZ (same region): $0.01/GB
Cross-region:          $0.02/GB
To internet:           $0.09/GB
```

**Optimization Strategies**:

1. **Colocate services** in same AZ when latency allows
2. **Use CloudFront** for static content ($0.085/GB vs $0.09/GB S3 direct)
3. **Compress responses** (gzip reduces transfer by 70%)
4. **Cache aggressively** to reduce origin requests
5. **VPC endpoints** for AWS services (free vs NAT Gateway $0.045/GB)

```hcl
# VPC endpoint saves NAT Gateway costs
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.us-east-1.s3"
  
  route_table_ids = [aws_route_table.private.id]
}

# Traffic to S3 now goes through endpoint (free)
# instead of NAT Gateway ($0.045/GB)
# 1 TB/month saves $46.08
```

---

## Best Practices Summary

### Regular Cost Reviews

**Weekly**:
- Check Cost Explorer for unexpected spikes
- Review cost anomaly alerts

**Monthly**:
- Analyze top 10 services by cost
- Review budget vs actual spending
- Identify unused resources (Lambda script)
- Team chargeback reports

**Quarterly**:
- Rightsize instances based on 90-day metrics
- Review reserved instance coverage
- Update budgets for next quarter
- Audit cost allocation tags

**Annually**:
- Review 3-year reserved instance strategy
- Evaluate multi-cloud cost comparison
- Update cost optimization roadmap

### Cost Optimization Checklist

**Compute**:
- [ ] Rightsize instances using Compute Optimizer
- [ ] Purchase reserved instances for steady workloads (30-60% savings)
- [ ] Use spot instances for batch/fault-tolerant workloads (70-90% savings)
- [ ] Enable auto scaling for variable workloads
- [ ] Stop non-production instances nights/weekends
- [ ] Migrate to Lambda for infrequent/short-duration tasks

**Storage**:
- [ ] Implement S3 lifecycle policies (Standard → IA → Glacier)
- [ ] Delete unattached EBS volumes
- [ ] Delete old snapshots (>90 days)
- [ ] Convert gp2 to gp3 volumes (20% savings)
- [ ] Enable S3 Intelligent-Tiering for unknown access patterns

**Network**:
- [ ] Release unassociated Elastic IPs
- [ ] Use VPC endpoints instead of NAT Gateway where possible
- [ ] Enable CloudFront for static content
- [ ] Compress data before transfer
- [ ] Colocate services in same AZ

**Database**:
- [ ] Rightsize RDS instances
- [ ] Use Aurora Serverless for variable workloads
- [ ] Delete old RDS snapshots
- [ ] Consider read replicas vs Multi-AZ cost tradeoff

**Monitoring**:
- [ ] Set up budget alerts (80%, 100%)
- [ ] Enable cost anomaly detection
- [ ] Daily cost reports to team
- [ ] Tag all resources for allocation
- [ ] Dashboard showing cost by team/project

**Culture**:
- [ ] Cost review in sprint planning
- [ ] Infracost checks in CI/CD
- [ ] Team cost targets and accountability
- [ ] Celebrate cost reduction wins
- [ ] Document cost-aware architecture patterns

---

## Troubleshooting

### Issue: Cost Unexpectedly High

**Diagnosis**:
```bash
# Check today vs yesterday
aws ce get-cost-and-usage \
  --time-period Start=2026-01-29,End=2026-01-31 \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE

# Identify service with spike
# Check anomaly detection for automatic alerts
aws ce get-anomalies \
  --date-interval StartDate=2026-01-01,EndDate=2026-01-31

# Detailed resource-level costs
# Query CUR data in Athena for specific resources
```

**Common Causes**:
- New instances launched (auto scaling event?)
- Instance type changed (manual modification?)
- Data transfer spike (DDoS? Failed deployment?)
- Snapshot accumulation (automated backups running?)

### Issue: Reserved Instances Not Applying

**Check Coverage**:
```bash
# RI utilization report
aws ce get-reservation-utilization \
  --time-period Start=2026-01-01,End=2026-01-31 \
  --granularity MONTHLY

# If utilization <100%, RIs not fully used
# If utilization 100% but costs still high, need more RIs
```

**Reasons**:
- Instance type mismatch (RI for t3.medium, running t3.large)
- Region mismatch (RI in us-east-1, instance in us-west-2)
- Account mismatch (RI in account A, instance in account B)
- Tenancy mismatch (RI for shared, instance dedicated)

**Fix**: Purchase correct RI or modify instances to match existing RIs

### Issue: Tags Not Showing in Cost Reports

**Enable Cost Allocation Tags**:
```bash
# Activate tags for billing
aws ce update-cost-allocation-tags-status \
  --cost-allocation-tags-status file://tags.json

# tags.json
[{
  "TagKey": "Team",
  "Status": "Active"
}, {
  "TagKey": "Environment",
  "Status": "Active"
}]

# Takes 24 hours to appear in reports
```

### Issue: Infracost Shows $0 for Resource

Some resources not yet supported or require additional config:

```bash
# Enable detailed logging
infracost breakdown --path . --log-level debug

# Check Infracost pricing database
# Some services may not have pricing data for all regions
```

Workaround: Manually estimate and add to README

---

## What's Next?

After optimizing infrastructure costs, consider:

1. **[Security Hardening](./security-hardening)** - Secure optimized infrastructure with CIS benchmarks and compliance
2. **[Monitoring Stack](../observability/prometheus-advanced)** - Monitor cost metrics alongside performance
3. **[CI/CD Pipeline](../cicd/forgejo-introduction)** - Automate cost checks in deployment pipeline
4. **[Multi-Cloud Strategy](../cloud/multi-cloud-basics)** - Compare AWS vs Azure vs GCP pricing

---

## Additional Resources

**AWS Documentation**:
- [AWS Cost Management](https://aws.amazon.com/aws-cost-management/)
- [AWS Pricing Calculator](https://calculator.aws/)
- [Cost Optimization Pillar - Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/)

**Tools**:
- [Infracost](https://www.infracost.io/) - Terraform cost estimation
- [CloudHealth](https://www.cloudhealthtech.com/) - Multi-cloud cost management
- [Spot.io](https://spot.io/) - Automated spot instance management
- [Kubecost](https://www.kubecost.com/) - Kubernetes cost allocation

**Guides**:
- [AWS Cost Optimization Best Practices](https://aws.amazon.com/pricing/cost-optimization/)
- [Google Cloud Cost Optimization](https://cloud.google.com/cost-management)
- [Azure Cost Management Best Practices](https://docs.microsoft.com/en-us/azure/cost-management-billing/)

---

## Change Log

- **2026-01-30**: Initial version covering cost analysis, rightsizing, pricing models, allocation, budgets, storage optimization, cleanup, estimation, and architecture patterns
