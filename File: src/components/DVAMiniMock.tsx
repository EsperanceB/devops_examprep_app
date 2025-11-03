// File: src/components/DVAMiniMock.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, X, AlertTriangle, TimerReset, Clock, Pause, Play, Menu as MenuIcon } from "lucide-react";
import { EXTRA_BANK } from "@/data/dva_bank_extra";

// --- Config: defaults mimic the full exam ---
const DEFAULT_QUESTION_COUNT = 65;
const DEFAULT_DURATION_MIN = 130;

// --- Question Bank (DVA-C02 level) ---
// Each question: id, domain, difficulty, stem, choices[], answer (index), explanation
const BANK = [
  {
    id: 1,
    domain: "Development (32%)",
    difficulty: "Medium",
    stem:
      "You built an HTTP API (API Gateway) that invokes a Lambda function. Responses occasionally exceed 5 MB. Clients get 502 errors despite Lambda succeeding. What should you change to reliably return large payloads with minimal backend changes?",
    choices: [
      "Switch API to REST API which supports up to 10 MB responses",
      "Return a pre-signed S3 URL and have clients download from S3",
      "Increase Lambda memory to increase payload limit",
      "Use WebSocket API which does not have payload limits",
    ],
    answer: 1,
    explanation:
      "HTTP and REST APIs both enforce response size limits (10 MB max on API GW; Lambda invoke payload is 6 MB). Best pattern is to store large content in S3 and return a pre-signed URL to the client.",
  },
  {
    id: 2,
    domain: "Security (26%)",
    difficulty: "Medium",
    stem:
      "A partner must call your REST API programmatically using short‑lived credentials without building a custom authorizer. Which option provides least operational work and fine-grained authorization?",
    choices: [
      "API keys with usage plans",
      "IAM authorization with SigV4; partner assumes a role you expose",
      "Lambda authorizer returning IAM policies",
      "Cognito user pool with hosted UI and OAuth2",
    ],
    answer: 1,
    explanation:
      "Use API Gateway IAM auth with SigV4. Provide a role the partner can assume via STS; attach fine-grained IAM policies to control access.",
  },
  {
    id: 3,
    domain: "Deployment (24%)",
    difficulty: "Easy",
    stem:
      "You deploy a Lambda with CodeDeploy. The team wants canary 10% for 5 minutes then 100% with automatic rollback on elevated 5xx and latency. What should you configure?",
    choices: [
      "Route 53 weighted records",
      "CodeDeploy deployment config Canary10Percent5Minutes with CloudWatch alarms",
      "Two API Gateway stages and manual cutover",
      "Lambda reserved concurrency set to 10% during deploy",
    ],
    answer: 1,
    explanation:
      "CodeDeploy supports traffic shifting for Lambda. Use Canary10Percent5Minutes and wire CloudWatch alarms for rollback.",
  },
  {
    id: 4,
    domain: "Troubleshooting (18%)",
    difficulty: "Medium",
    stem:
      "A synchronous Lambda behind API Gateway sometimes runs ~40s. Clients see 504 Gateway Timeout even though the function completes. What's the best fix?",
    choices: [
      "Raise API Gateway timeout to 60 seconds",
      "Move work to an async flow: accept request, enqueue to SQS/EventBridge, return 202, and poll status",
      "Increase Lambda memory",
      "Place function in a VPC",
    ],
    answer: 1,
    explanation:
      "API Gateway timeout is ~29–30s. For longer tasks, switch to async patterns (queue/workflow) and provide a status endpoint.",
  },
  {
    id: 5,
    domain: "Development (32%)",
    difficulty: "Medium",
    stem:
      "A DynamoDB table uses PK=customerId, SK=orderTs. During flash sales, reads for a few customers get hot and throttle. You must minimize cost and code changes while reducing latency. What should you do?",
    choices: [
      "Add a GSI on order status",
      "Enable DAX and use it for read-heavy endpoints",
      "Switch to strongly consistent reads",
      "Migrate to RDS for caching",
    ],
    answer: 1,
    explanation:
      "DAX provides read-through caching with microsecond latency and offloads hot keys—low code change, cost-effective for read spikes.",
  },
  {
    id: 6,
    domain: "Security (26%)",
    difficulty: "Easy",
    stem:
      "A Lambda needs an API key that rotates automatically. The key must not be stored in code and should be fetched efficiently. Best practice?",
    choices: [
      "Parameter Store SecureString with no rotation",
      "Secrets Manager with rotation and in-memory caching with TTL",
      "Environment variable encrypted with KMS",
      "Store encrypted key in /tmp and refresh hourly",
    ],
    answer: 1,
    explanation:
      "Secrets Manager supports managed rotation and caching SDKs; fetch once per container and cache with TTL.",
  },
  {
    id: 7,
    domain: "Deployment (24%)",
    difficulty: "Medium",
    stem:
      "You package a Python Lambda needing native libraries (ImageMagick). The zip deployment fails due to dependencies. Minimal ops overhead?",
    choices: [
      "Compile wheels on dev machines and upload",
      "Build a Lambda container image using AWS base image; push to ECR",
      "Bundle binaries into /tmp at runtime",
      "Switch to Node.js runtime",
    ],
    answer: 1,
    explanation:
      "Container images for Lambda solve native dependency packaging reliably with minimal operational burden.",
  },
  {
    id: 8,
    domain: "Troubleshooting (18%)",
    difficulty: "Easy",
    stem:
      "Your SQS‑triggered Lambda is causing account concurrency to spike, starving other functions. You need isolation fast. What do you change?",
    choices: [
      "Increase account concurrency limit",
      "Set a reserved concurrency on the hot consumer function",
      "Reduce SQS visibility timeout",
      "Disable batching",
    ],
    answer: 1,
    explanation:
      "Reserved concurrency caps a function's concurrency and protects others (and guarantees some for this one if using provisioned).",
  },
  {
    id: 9,
    domain: "Development (32%)",
    difficulty: "Medium",
    stem:
      "You must process every image uploaded to many producer accounts in one consumer account with least cross‑account plumbing. What's best?",
    choices: [
      "Direct S3 bucket notifications to consumer Lambda across accounts",
      "S3 to EventBridge in each account and route to a central bus (org bus)",
      "Replicate all objects into one bucket and trigger there",
      "S3 to SNS then cross-account subscription",
    ],
    answer: 1,
    explanation:
      "S3 → EventBridge with org routing simplifies cross-account fan‑in and centralizes rules/targets.",
  },
  {
    id: 10,
    domain: "Security (26%)",
    difficulty: "Easy",
    stem:
      "You need to ensure an S3 direct-upload (pre-signed PUT) never accepts files over 25 MB. What's the enforcement mechanism?",
    choices: [
      "Client-side check only",
      "Add a bucket lifecycle rule",
      "Include a content-length-range condition in the pre-signed policy",
      "Rely on S3 Intelligent-Tiering",
    ],
    answer: 2,
    explanation:
      "Pre-signed POST/PUT policies can enforce `content-length-range` so S3 rejects larger uploads server-side.",
  },
  {
    id: 11,
    domain: "Troubleshooting (18%)",
    difficulty: "Medium",
    stem:
      "A Step Functions Express workflow runs at high TPS. You need per-execution visibility. What's true about execution history?",
    choices: [
      "Express workflows expose full history via GetExecutionHistory",
      "Standard workflows do not retain history",
      "Express workflows rely on CloudWatch Logs for execution details; Standard supports GetExecutionHistory",
      "Neither workflow type exposes history",
    ],
    answer: 2,
    explanation:
      "Standard exposes durable execution history via API; Express uses CloudWatch Logs for visibility.",
  },
  {
    id: 12,
    domain: "Deployment (24%)",
    difficulty: "Easy",
    stem:
      "You must block merges of CloudFormation templates that include wildcard actions like `Action: \"*\"`. What's the most automated control?",
    choices: [
      "Manual code reviews",
      "cfn-guard rules in CI to fail the pipeline",
      "Drift detection",
      "Trusted Advisor checks",
    ],
    answer: 1,
    explanation:
      "cfn-guard enforces IaC policy pre-deploy and is easily automated in CI/CD.",
  },
  {
    id: 13,
    domain: "Development (32%)",
    difficulty: "Easy",
    stem:
      "You expect 300 requests/sec, each reading 3 items of 4 KB strongly consistent from DynamoDB. Approximate RCUs needed (provisioned)?",
    choices: ["225", "450", "900", "1200"],
    answer: 2,
    explanation:
      "Strongly consistent: 1 RCU per 4 KB item per second. 300 req/s × 3 items = 900 RCUs.",
  },
  {
    id: 14,
    domain: "Security (26%)",
    difficulty: "Easy",
    stem:
      "A mobile app signs users in with Cognito User Pools. On sign‑in, you must enrich analytics by calling a third‑party API asynchronously without changing the app. Best solution?",
    choices: [
      "Add a Lambda authorizer",
      "Use a User Pool post‑authentication trigger (Lambda) to call the API",
      "Use identity pools with role mappings",
      "Use CloudTrail to export sign‑in events",
    ],
    answer: 1,
    explanation:
      "Post‑auth trigger runs on successful auth and can invoke external services asynchronously.",
  },
  {
    id: 15,
    domain: "Troubleshooting (18%)",
    difficulty: "Medium",
    stem:
      "An API backed by Lambda sees sporadic 429s. CloudWatch shows high `Throttles` for the function, but average concurrency is low. What single setting most likely fixes it?",
    choices: [
      "Increase function timeout",
      "Set or raise reserved concurrency to a safe cap (and provisioned if needed)",
      "Lower memory to slow scaling",
      "Switch to WebSockets",
    ],
    answer: 1,
    explanation:
      "Throttles can occur if bursts exceed unreserved capacity or other functions consume it; reserved concurrency isolates capacity for this function.",
  },
  // --- New questions to broaden coverage (total 35) ---
  {
    id: 16,
    domain: "Development (32%)",
    difficulty: "Medium",
    stem: "A Lambda function in a VPC suddenly experiences long cold starts. The function needs access only to DynamoDB and S3. How can you reduce cold start latency with minimal changes?",
    choices: [
      "Attach a NAT Gateway to the private subnets",
      "Remove the VPC configuration from the function",
      "Increase timeout and memory",
      "Add more ENIs to the subnets",
    ],
    answer: 1,
    explanation: "If the function doesn't need VPC-only resources, removing the VPC avoids ENI attach latency and reduces cold starts.",
  },
  {
    id: 17,
    domain: "Security (26%)",
    difficulty: "Medium",
    stem: "You must encrypt objects in S3 using a customer-managed KMS key and ensure only a specific role can decrypt. Where do you enforce this most effectively?",
    choices: [
      "Bucket policy only",
      "Key policy granting decrypt to the role and denying others",
      "IAM policy on the role only",
      "S3 ACLs",
    ],
    answer: 1,
    explanation: "KMS key policy is the source of truth; grant the role decrypt and restrict others. Bucket/IAM policies complement but cannot override KMS.",
  },
  {
    id: 18,
    domain: "Deployment (24%)",
    difficulty: "Medium",
    stem: "You need repeatable, reviewable infrastructure changes with automatic drift detection. Which approach aligns best?",
    choices: ["AWS CDK with pipelines", "AWS SAM CLI deploy", "Manual console changes with CloudTrail", "Elastic Beanstalk console updates"],
    answer: 0,
    explanation: "CDK synths CloudFormation stacks, supports code review, pipelines, and drift detection on stacks.",
  },
  {
    id: 19,
    domain: "Troubleshooting (18%)",
    difficulty: "Medium",
    stem: "A Lambda consuming SQS messages reports timeouts. CloudWatch shows it processes exactly 1 message per invocation even though batch size is 10. Why could this be happening?",
    choices: [
      "Visibility timeout is too high",
      "Batch window is disabled",
      "The function errors partway; partial batch response deletes only successes",
      "The queue is FIFO",
    ],
    answer: 2,
    explanation: "With partial batch responses, only successful messages are deleted; repeated errors can make it appear as single-message processing.",
  },
  {
    id: 20,
    domain: "Development (32%)",
    difficulty: "Hard",
    stem: "You need exactly-once processing for financial transactions from many producers. Which combination provides strongest guarantees with minimal custom logic?",
    choices: [
      "SQS Standard + Lambda + DynamoDB conditional writes",
      "Kinesis Data Streams + Lambda + DynamoDB idempotency",
      "SQS FIFO with content-based deduplication + Lambda + idempotency",
      "SNS + Lambda + Step Functions",
    ],
    answer: 2,
    explanation: "SQS FIFO preserves order and deduplicates; combined with idempotency keys in DynamoDB gives near exactly-once at-least-once semantics.",
  },
  {
    id: 21,
    domain: "Security (26%)",
    difficulty: "Easy",
    stem: "Which control prevents public access to any object in an S3 bucket regardless of object ACLs?",
    choices: ["Block Public Access at account/bucket level", "Bucket policy deny with aws:PrincipalOrgID", "S3 Access Points", "Default encryption"],
    answer: 0,
    explanation: "Block Public Access overrides ACLs and most policies to prevent public access.",
  },
  {
    id: 22,
    domain: "Deployment (24%)",
    difficulty: "Medium",
    stem: "A CodeBuild project downloads large dependencies repeatedly. You want to reduce build times and costs. What should you enable?",
    choices: ["Privileged mode", "Local cache modes (source, docker layer, custom)", "Batch builds", "Artifact encryption"],
    answer: 1,
    explanation: "CodeBuild local caching caches sources/deps and docker layers across builds on the same host to speed builds.",
  },
  {
    id: 23,
    domain: "Troubleshooting (18%)",
    difficulty: "Easy",
    stem: "Your API Gateway calls an HTTP backend. Occasionally responses are 504. You must retry safely. Which setting should you adjust first?",
    choices: ["Increase stage throttling", "Set an integration timeout and enable retry on 5xx with exponential backoff", "Enable request validation", "Use default NLB health checks"],
    answer: 1,
    explanation: "HTTP integrations support timeouts and automatic retries on certain 5xx; add backoff to avoid overload.",
  },
  {
    id: 24,
    domain: "Development (32%)",
    difficulty: "Medium",
    stem: "You need to stream click events to near-real-time analytics with per-partition ordering. Which service combination is most appropriate?",
    choices: ["SNS > SQS", "Kinesis Data Streams > Lambda > Firehose", "EventBridge > S3", "S3 > Athena"],
    answer: 1,
    explanation: "Kinesis provides ordered shards; Lambda can transform; Firehose delivers to analytics sinks.",
  },
  {
    id: 25,
    domain: "Security (26%)",
    difficulty: "Medium",
    stem: "A web client uploads directly to S3 using a pre‑signed POST. You need to enforce that objects have a specific prefix and are tagged. Where do you enforce this?",
    choices: ["Bucket lifecycle", "Pre‑signed policy conditions", "Lambda@Edge", "S3 Replication configuration"],
    answer: 1,
    explanation: "Policy conditions can enforce key prefix and x-amz-tagging so S3 rejects invalid uploads.",
  },
  {
    id: 26,
    domain: "Deployment (24%)",
    difficulty: "Medium",
    stem: "You maintain a multi-stage serverless app. You want each PR to create an isolated ephemeral environment automatically. What fits best?",
    choices: ["Single shared stage with feature flags", "CDK pipelines to synth/deploy a stack per branch/PR", "Copy production stack manually", "Elastic Beanstalk blue/green"],
    answer: 1,
    explanation: "CDK Pipelines supports ephemeral stacks per PR for isolated testing.",
  },
  {
    id: 27,
    domain: "Troubleshooting (18%)",
    difficulty: "Hard",
    stem: "A Step Functions Standard workflow with a Map state occasionally fails mid-batch. You need automatic limited retries with jitter at the state level. What should you configure?",
    choices: ["Catch on the Map and Retry on the iterator with backoff/jitter", "Global retry policy", "Increase execution timeout", "Convert to Express"],
    answer: 0,
    explanation: "Use state-level Retry with BackoffRate and add jitter (service integration) or randomization; catch to handle failure items.",
  },
  {
    id: 28,
    domain: "Development (32%)",
    difficulty: "Easy",
    stem: "You need cross-origin browser access to an API Gateway HTTP API. Which setting must be enabled?",
    choices: ["Usage plans", "CORS with allowed origins/methods/headers", "Client certificates", "Mutual TLS"],
    answer: 1,
    explanation: "Enable CORS and specify allowed origins/methods/headers for browser calls.",
  },
  {
    id: 29,
    domain: "Security (26%)",
    difficulty: "Hard",
    stem: "A service running on Fargate must call a third‑party API with a static IP allowlist. You want to keep the architecture serverless. What do you use?",
    choices: ["Internet Gateway", "NAT Gateway in public subnet", "NLB + EIP", "VPC endpoints"],
    answer: 1,
    explanation: "Egress static IP via NAT Gateway's public IP; Fargate in private subnets routes through NAT GW.",
  },
  {
    id: 30,
    domain: "Deployment (24%)",
    difficulty: "Medium",
    stem: "You want one-click rollbacks for a Lambda version after a failed deployment. Which combination provides this?",
    choices: ["SAM sync", "CodeDeploy with alarms and traffic shifting", "CloudFormation Change Sets only", "Manual alias change"],
    answer: 1,
    explanation: "CodeDeploy shifts traffic and can auto-rollback when alarms breach.",
  },
  {
    id: 31,
    domain: "Troubleshooting (18%)",
    difficulty: "Medium",
    stem: "A DynamoDB stream to Lambda occasionally reprocesses items due to retries. How do you make updates idempotent?",
    choices: [
      "Use UpdateItem without conditions",
      "Use a dedup table keyed by eventID and conditional writes",
      "Switch to scans",
      "Increase batch size",
    ],
    answer: 1,
    explanation: "Store event IDs in a dedup table and use ConditionExpression to ensure one processing per event.",
  },
  {
    id: 32,
    domain: "Development (32%)",
    difficulty: "Hard",
    stem: "You need to call a private RDS instance from Lambda with minimal network management. What should you choose?",
    choices: ["Lambda in VPC + RDS Proxy", "Public RDS + SG restrictions", "PrivateLink to RDS", "API Gateway VPC Link"],
    answer: 0,
    explanation: "RDS Proxy manages connections and helps with cold start spikes; Lambda must be in VPC to reach RDS.",
  },
  {
    id: 33,
    domain: "Security (26%)",
    difficulty: "Medium",
    stem: "You must provide temporary S3 access for untrusted clients to upload, restricted to a prefix and TTL. Best solution?",
    choices: ["Long‑lived IAM users", "STS AssumeRole with external ID and pre‑signed URLs", "S3 Access Points only", "Public bucket"],
    answer: 1,
    explanation: "Issue STS creds scoped to the prefix/TTL and use pre‑signed flows; no long‑lived credentials.",
  },
  {
    id: 34,
    domain: "Deployment (24%)",
    difficulty: "Easy",
    stem: "Which CDK construct scope best practice improves maintainability across stacks?",
    choices: ["Monolithic single stack", "Use nested stacks for large logical units", "Put all resources in the App", "Never use aspects"],
    answer: 1,
    explanation: "Nested stacks help modularize and manage large deployments.",
  },
  {
    id: 35,
    domain: "Troubleshooting (18%)",
    difficulty: "Easy",
    stem: "CloudWatch Logs for a Lambda show `Task timed out`. What metric/alarm pair most directly catches this in deployments for rollback?",
    choices: ["Invocations & Errors", "Duration p99 & Throttles", "Lambda Errors and Timeout metric with CodeDeploy alarm", "IteratorAge"],
    answer: 2,
    explanation: "Use Lambda `Errors` and `Timeouts` (or specific error patterns) as CodeDeploy rollback alarms.",
  },
] as const;

// Merge base bank with the extra questions file (no repeats at runtime due to sampling without replacement)
const ALL_BANK = [...BANK, ...EXTRA_BANK];

type Question = typeof BANK[number];

type QuestionInstance = Question & { iid: string };

// --- Utilities ---
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildExam(
  bank: readonly Question[],
  count: number,
  seed: number,
  topics: string[],
  difficulties: string[]
): QuestionInstance[] {
  // Optional filters
  const filteredByTopic = topics.length === 0
    ? bank
    : bank.filter((q) => topics.some((t) => q.domain.toLowerCase().startsWith(t.toLowerCase())));
  const filtered = difficulties.length === 0
    ? filteredByTopic
    : filteredByTopic.filter((q) => difficulties.includes(q.difficulty));

  const source = filtered.length > 0 ? filtered : bank; // fallback to full bank if filter leaves none

  // Shuffle deterministically using seed, then take the first N (WITHOUT replacement)
  const rng = mulberry32(seed);
  const shuffled = [...source];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const take = Math.min(count, shuffled.length);
  const out: QuestionInstance[] = [];
  for (let i = 0; i < take; i++) {
    const q = shuffled[i];
    out.push({ ...q, iid: `${q.id}-${i + 1}` });
  }
  return out;
}

export default function DVAMiniMock() {
  // --- Self-tests (runtime validation of the question bank) ---
  const validation = useMemo(() => validateBank(ALL_BANK), []);

  // Controls (sidebar)
  const [menuOpen, setMenuOpen] = useState(false);
  const [desiredCount, setDesiredCount] = useState<number>(DEFAULT_QUESTION_COUNT);
  const [chosenTopics, setChosenTopics] = useState<string[]>([]); // values: Development, Security, Deployment, Troubleshooting
  const [chosenDifficulty, setChosenDifficulty] = useState<string[]>([]); // Easy, Medium, Hard

  // Available questions for current filters (for sidebar display)
  const available = useMemo(() => {
    const byTopic = chosenTopics.length === 0
      ? ALL_BANK
      : ALL_BANK.filter((q) => chosenTopics.some((t) => q.domain.toLowerCase().startsWith(t.toLowerCase())));
    const byDiff = chosenDifficulty.length === 0
      ? byTopic
      : byTopic.filter((q) => chosenDifficulty.includes(q.difficulty));
    return byDiff.length;
  }, [chosenTopics, chosenDifficulty]);

  // Exam data
  const [seed] = useState(() => Math.floor(Math.random() * 1e9));
  const [questionCount, setQuestionCount] = useState<number>(DEFAULT_QUESTION_COUNT);
  const questions = useMemo(() => buildExam(ALL_BANK, questionCount, seed, chosenTopics, chosenDifficulty), [seed, questionCount, chosenTopics, chosenDifficulty]);

  const [answers, setAnswers] = useState<Record<string, number | null>>(() => ({}));
  const [graded, setGraded] = useState(false);

  // Timed mode (default ON at 130 minutes)
  const [timed, setTimed] = useState(true);
  const [duration, setDuration] = useState<number>(DEFAULT_DURATION_MIN);
  const [remaining, setRemaining] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(false);
  const [timeUp, setTimeUp] = useState<boolean>(false);

  const total = questions.length;
  const answered = Object.values(answers).filter((v) => v !== null && v !== undefined).length;
  const correct = questions.reduce((acc, q) => acc + ((answers[q.iid] === q.answer) ? 1 : 0), 0);

  const domainStats = useMemo(() => {
    const map: Record<string, { total: number; correct: number }> = {};
    for (const q of questions) {
      if (!map[q.domain]) map[q.domain] = { total: 0, correct: 0 };
      map[q.domain].total++;
      if (answers[q.iid] === q.answer) map[q.domain].correct++;
    }
    return map;
  }, [questions, answers]);

  function select(iid: string, idx: number) {
    if (graded) return;
    setAnswers((prev) => ({ ...prev, [iid]: idx }));
  }

  function grade() {
    setGraded(true);
    setRunning(false);
  }

  function reset() {
    setAnswers({});
    setGraded(false);
    setRunning(false);
    setTimeUp(false);
    setRemaining(0);
  }

  // timer effect: countdown and auto-grade
  useEffect(() => {
    if (!running || graded) return;
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setRunning(false);
          setTimeUp(true);
          setGraded(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, graded]);

  const totalSecs = duration * 60;
  const timePct = totalSecs > 0 ? (remaining / totalSecs) * 100 : 0;

  function startTimed() {
    setAnswers({});
    setGraded(false);
    setTimeUp(false);
    setRemaining(duration * 60);
    setRunning(true);
  }
  function pauseTimed() { setRunning(false); }
  function resumeTimed() { if (remaining > 0 && timed && !graded) setRunning(true); }

  // Apply sidebar selections to local exam (and optionally sync time)
  function applyLocalExam() {
    const c = Math.max(5, Math.min(100, desiredCount));
    setQuestionCount(c);
    if (timed) {
      const suggested = Math.min(240, Math.max(10, c * 2));
      setDuration(suggested);
    }
    setMenuOpen(false);
    reset();
  }

  return (
    <div className="p-0 max-w-[100rem] mx-auto">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setMenuOpen((v) => !v)} title="Toggle menu">
              <MenuIcon className="w-4 h-4 mr-2" /> Menu
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold">AWS Certified Developer – Associate (DVA‑C02) Mini‑Mock</h1>
              <p className="text-xs md:text-sm text-muted-foreground">{total} questions · Select answers then click <span className="font-semibold">Grade</span>. Use the menu to customize the quiz.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Timed mode controls */}
            <div className="hidden md:flex items-center gap-2">
              <label className="text-sm flex items-center gap-1">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={timed}
                  onChange={(e) => {
                    setTimed(e.target.checked);
                    setRunning(false);
                    setTimeUp(false);
                    setRemaining(0);
                  }}
                />
                Timed
              </label>
              <select
                className="border rounded-md px-2 py-1 text-sm"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                disabled={running || graded}
                title="Duration (minutes)"
              >
                <option value={15}>15m</option>
                <option value={30}>30m</option>
                <option value={60}>60m</option>
                <option value={120}>120m</option>
                <option value={130}>130m</option>
              </select>
              {!running && !graded && (
                <Button variant="outline" onClick={startTimed} title="Start timed session">
                  <Play className="w-4 h-4 mr-2" /> Start
                </Button>
              )}
              {running && !graded && (
                <Button variant="outline" onClick={pauseTimed} title="Pause timer">
                  <Pause className="w-4 h-4 mr-2" /> Pause
                </Button>
              )}
              {!running && remaining > 0 && !graded && (
                <Button variant="outline" onClick={resumeTimed} title="Resume timer">
                  <Play className="w-4 h-4 mr-2" /> Resume
                </Button>
              )}
              <Button variant="secondary" onClick={reset} title="Reset">
                <TimerReset className="w-4 h-4 mr-2" /> Reset
              </Button>
              <Button onClick={grade} disabled={graded || answered === 0} title="Grade now">
                {graded ? "Graded" : "Grade"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main */}
        <div className="lg:col-span-9 space-y-6">
          <div>
            <Progress value={(answered / total) * 100} />
            <div className="text-sm mt-2">Answered {answered}/{total}</div>
            {timed && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4" /><span>Time remaining</span></div>
                  <div className="text-sm tabular-nums">{formatHMS(remaining)}{running ? "" : remaining > 0 && !graded ? " (paused)" : ""}</div>
                </div>
                <Progress value={timePct} />
                {timeUp && <div className="text-sm text-red-600 mt-2">Time's up — your answers have been auto‑graded.</div>}
              </div>
            )}
          </div>

          {validation.errors.length > 0 && (
            <Card className="border rounded-2xl bg-yellow-50">
              <CardContent className="p-4 text-sm">
                <div className="font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Self‑tests found issues in the question bank:</div>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  {validation.errors.map((e, i) => (<li key={i}>{e}</li>))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {questions.map((q, qi) => {
              const picked = answers[q.iid];
              const isCorrect = graded && picked === q.answer;
              const isWrong = graded && picked !== undefined && picked !== null && picked !== q.answer;
              return (
                <Card key={q.iid} className="border rounded-2xl shadow-sm">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">{q.domain} • {q.difficulty}</div>
                        <h2 className="font-medium mt-1">{qi + 1}. {q.stem}</h2>
                      </div>
                      {graded && (
                        <div className={`rounded-full p-2 ${isCorrect ? "bg-green-100" : isWrong ? "bg-red-100" : "bg-muted"}`}>
                          {isCorrect ? <Check className="text-green-600" /> : isWrong ? <X className="text-red-600" /> : <AlertTriangle />}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {q.choices.map((c, idx) => {
                        const chosen = picked === idx;
                        const correctChoice = graded && q.answer === idx;
                        return (
                          <button
                            key={idx}
                            onClick={() => select(q.iid, idx)}
                            className={`w-full text-left border rounded-xl p-3 transition ${chosen ? "border-primary" : "border-muted"} ${graded && correctChoice ? "bg-green-50" : ""} ${graded && chosen && !correctChoice ? "bg-red-50" : ""}`}
                            disabled={graded}
                          >
                            <span className="mr-2">{String.fromCharCode(65 + idx)}.</span> {c}
                          </button>
                        );
                      })}
                    </div>

                    {graded && (
                      <div className="text-sm text-muted-foreground pt-2 border-t">
                        <span className="font-semibold">Why: </span>{q.explanation}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Results graded={graded} correct={correct} total={total} domainStats={domainStats} />
        </div>

        {/* Sidebar (drawer on small screens) */}
        <aside className={`lg:col-span-3 fixed lg:static top-[64px] right-0 h-[calc(100vh-64px)] w-80 bg-background border-l z-30 transform transition-transform ${menuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}>
          <div className="p-4 space-y-4 overflow-y-auto h-full">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Playground Controls</div>
              <Button variant="ghost" size="sm" onClick={() => setMenuOpen(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Questions</label>
                <input type="number" min={5} max={100} value={desiredCount} onChange={(e) => setDesiredCount(parseInt(e.target.value || "0"))} className="mt-1 w-full border rounded-md px-3 py-2" />
                <p className=\"text-xs text-muted-foreground mt-1\">5–100. The app samples without replacement and caps to the available questions based on your filters. <span className=\"font-semibold\">Available now: {available}</span></p>
                {desiredCount > available && (
                  <p className=\"text-xs text-amber-600 mt-1\">Requested <span className=\"font-semibold\">{desiredCount}</span> exceeds available. The quiz will include <span className=\"font-semibold\">{available}</span> unique questions.</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Difficulty</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {['Easy','Medium','Hard'].map((d) => (
                    <label key={d} className="text-sm flex items-center gap-2 border rounded-md px-2 py-1">
                      <input type="checkbox" checked={chosenDifficulty.includes(d)} onChange={(e) => {
                        setChosenDifficulty((prev) => e.target.checked ? [...prev, d] : prev.filter((x) => x !== d));
                      }} /> {d}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Topics / Domains</label>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  {['Development', 'Security', 'Deployment', 'Troubleshooting'].map((t) => (
                    <label key={t} className="text-sm flex items-center gap-2 border rounded-md px-2 py-1">
                      <input type="checkbox" checked={chosenTopics.includes(t)} onChange={(e) => {
                        setChosenTopics((prev) => e.target.checked ? [...prev, t] : prev.filter((x) => x !== t));
                      }} /> {t}
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex gap-2">
                  <Button onClick={applyLocalExam}>Apply</Button>
                  <Button variant="secondary" onClick={() => { setChosenDifficulty([]); setChosenTopics([]); setDesiredCount(DEFAULT_QUESTION_COUNT); }}>Reset filters</Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Tip: leave filters empty for a mixed exam across all domains and difficulties.</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function formatHMS(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(sec).padStart(2, "0");
  return (h > 0 ? `${h}:` : "") + `${mm}:${ss}`;
}

function Results({ graded, correct, total, domainStats }: { graded: boolean; correct: number; total: number; domainStats: Record<string, { total: number; correct: number }>; }) {
  if (!graded) return null;
  const pct = Math.round((correct / total) * 100);
  return (
    <div className="space-y-4">
      <Card className="border rounded-2xl">
        <CardContent className="p-5">
          <div className="text-lg font-semibold">Your Score</div>
          <div className="text-3xl font-bold mt-1">{correct} / {total} ({pct}%)</div>
        </CardContent>
      </Card>
      <Card className="border rounded-2xl">
        <CardContent className="p-5 space-y-2">
          <div className="text-lg font-semibold">Domain Breakdown</div>
          {Object.entries(domainStats).map(([d, s]) => {
            const p = Math.round((s.correct / s.total) * 100);
            return (
              <div key={d} className="grid grid-cols-12 items-center gap-3">
                <div className="col-span-4 text-sm">{d}</div>
                <div className="col-span-6"><Progress value={p} /></div>
                <div className="col-span-2 text-right text-sm">{s.correct}/{s.total}</div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

// --- Runtime validation for the question bank (lightweight self-tests) ---
function validateBank(bank: readonly Question[]) {
  const seen = new Set<number>();
  const errors: string[] = [];
  bank.forEach((q, i) => {
    if (seen.has(q.id)) errors.push(`Duplicate id detected: ${q.id}`);
    seen.add(q.id);
    if (q.answer < 0 || q.answer >= q.choices.length) {
      errors.push(`Invalid answer index for id=${q.id} at position ${i}`);
    }
    if (!q.stem || q.choices.length < 2) {
      errors.push(`Malformed question at id=${q.id}`);
    }
  });
  return { errors };
}


// File: src/app/dva/page.tsx
import DVAMiniMock from "@/components/DVAMiniMock";

export default function Page() {
  return <DVAMiniMock />;
}
