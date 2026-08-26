# Comprehensive AI Intelligence Engine, Health Scoring & Anomaly Detection Architecture

This document provides a line-by-line, function-by-function technical breakdown of the **AI Intelligence Engine, Ollama LLM Integration, Deterministic Heuristic Engine Fallback, Hallucination Guardrails, and Health Scoring** in AssetIQ v2.

---

## 1. Subsystem Architecture Overview

The AssetIQ AI Engine employs a **Hybrid Intelligence Strategy**:
1. **Generative LLM Engine**: Integrates with a local Ollama instance (`http://127.0.0.1:11434`) featuring auto-model discovery (`qwen2.5:3b`, `llama3.1:8b`, `mistral`).
2. **Deterministic Heuristic Fallback Engine**: If Ollama is unreachable or times out (45s), a mathematical health scoring model executes instantly to ensure zero downtime.
3. **Hallucination Safeguards**: Strict post-processing validation enforces physical limits on health scores, failure risk percentages, and replacement recommendations based on equipment operational state.
4. **Caching & Cooldown Guard**: Implements a 15-minute cooldown per asset to optimize server resources.

---

## 2. Comprehensive Function Breakdown

File Path: [`backend/src/services/ai.service.js`](file:///c:/Projects/assetIQ-v2/backend/src/services/ai.service.js)

### 1. `getAvailableOllamaModel()`
- **Purpose**: Dynamically inspects local Ollama server tags (`GET /api/tags`) and selects the optimal available model.
- **Implementation**:
  ```javascript
  export const getAvailableOllamaModel = async () => {
    const now = Date.now();
    if (cachedModel && now - lastModelCheck < 60000) return cachedModel;

    try {
      const res = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 3000 });
      const models = (res.data?.models || []).map((m) => m.name || m.model);

      const preferred = [
        'qwen2.5:3b', 'qwen2.5:7b', 'qwen2.5',
        'llama3.1:8b', 'llama3.1',
        'mistral:latest', 'mistral',
        'deepseek-r1:1.5b'
      ];

      for (const p of preferred) {
        const match = models.find((m) => m === p || m.startsWith(p) || m.includes(p));
        if (match) {
          cachedModel = match;
          lastModelCheck = now;
          return cachedModel;
        }
      }
      if (models.length > 0) return models[0];
    } catch (err) {
      console.warn(`[AI Engine] Ollama tags offline (${err.message}), defaulting to 'qwen2.5:3b'`);
    }

    return 'qwen2.5:3b';
  };
  ```

---

### 2. `gatherAssetContext(assetId, organizationId, user)`
- **Purpose**: Assembles complete operational telemetry required for AI health evaluation.
- **Execution Steps**:
  1. Queries `Asset.findOne({ _id: assetId })` populated with `categoryId`, `vendorId`, `locationId`.
  2. Queries `Ticket` collection for all tickets associated with `assetId`:
     - Counts total repair tickets & active defect issues (`status: open / in_progress`).
     - Calculates total cumulative repair cost (`totalRepairCost`).
     - Identifies last repair date.
  3. Queries `Assignment` collection for total device assignment count and current assignment status.
  4. Queries `Warranty` collection for active vs expired OEM coverage status.
  5. Computes exact operational age in months:
     ```javascript
     const ageInMonths = asset.purchaseDate 
       ? Math.max(0, Math.floor((Date.now() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 30.4375)))
       : 0;
     ```
  6. Returns structured context object.

---

### 3. `buildPrompt(context)` & `sanitizePromptInput(val)`
- **Purpose**: Formats sanitized context into a structured JSON generation prompt.
- **Sanitization**:
  ```javascript
  const sanitizePromptInput = (val, maxLen = 80) => {
    if (!val) return 'None';
    return String(val).replace(/[\r\n\t]+/g, ' ').replace(/[{}<>"\\]/g, '').trim().slice(0, maxLen);
  };
  ```
- **Prompt Specification**:
  Instructs the LLM to analyze equipment data and output strictly formatted JSON containing `healthScore`, `failureRiskPercent`, `remainingUsefulLifeMonths`, `predictedNextMaintenanceDate`, `insights`, and `replacementRecommendation`.

---

### 4. `calculateHeuristicHealth(context)` (Deterministic Engine)
- **Purpose**: Provides exact mathematical health scoring when LLM is unavailable or when guardrails override LLM output.
- **Mathematical Formula**:
  ```javascript
  export const calculateHeuristicHealth = (context) => {
    const { ageInMonths = 0, expectedLifespan = 36, repairCount = 0, openRepairCount = 0, warrantyStatus = 'none', status = 'stock' } = context;

    // 1. Base Score calculation based on age ratio
    const ageRatio = expectedLifespan > 0 ? ageInMonths / expectedLifespan : 0.1;
    let healthScore = Math.round(100 - (Math.min(1.5, ageRatio) * 55));

    // 2. Failure Deductions
    healthScore -= (repairCount * 8);
    healthScore -= (openRepairCount * 18);

    // 3. Warranty Penalty
    if (warrantyStatus === 'expired') healthScore -= 8;

    // 4. Status Adjustments
    if (status === 'repair') {
      healthScore = Math.min(healthScore, 42) - 12;
    } else if (status === 'retired') {
      healthScore = 5;
    }

    // Clamp 5 - 100
    healthScore = Math.max(5, Math.min(100, healthScore));

    const failureRiskPercent = Math.max(0, Math.min(95, 100 - healthScore + (repairCount * 6) + (openRepairCount * 12)));
    const remainingUsefulLifeMonths = Math.max(0, Math.round(Math.max(0, expectedLifespan - ageInMonths) * (healthScore / 100)));

    let replacementRecommendation = 'keep';
    if (healthScore < 45 || ageInMonths > expectedLifespan || status === 'retired') {
      replacementRecommendation = 'replace';
    } else if (healthScore < 70 || status === 'repair' || repairCount >= 2 || openRepairCount > 0) {
      replacementRecommendation = 'repair';
    }

    return { healthScore, failureRiskPercent, remainingUsefulLifeMonths, insights: generateInsights(...), replacementRecommendation };
  };
  ```

---

### 5. `parseAIResponse(rawText, fallbackContext)` (Hallucination Guardrails)
- **Purpose**: Parses raw LLM text/markdown and enforces logical boundary constraints.
- **Guardrail Enforcement Rules**:
  - **Active Defect Guardrail**: If `status === 'repair'` or `openRepairCount > 0`, health score is clamped:
    ```javascript
    if (fallbackContext.status === 'repair' || fallbackContext.openRepairCount > 0) {
      if (healthScore > 48) {
        healthScore = Math.min(42, calculateHeuristicHealth(fallbackContext).healthScore);
      }
    }
    ```
  - **Retired Guardrail**: If `status === 'retired'`, health score is strictly set to `5`.
  - **Over-Age Guardrail**: If operational age > 130% of expected lifespan and score > 48, score is capped.
  - **Recommendation Consistency**: Ensures devices with health score >= 75 do not recommend replacement unless retired, and devices <= 35 recommend repair/replace.

---

### 6. Main Orchestrator: `analyzeAssetHealth(assetId, organizationId, user, options)`
1. Gathers context via `gatherAssetContext()`.
2. Checks **Cooldown Cache**:
   ```javascript
   if (!force && asset.ai?.lastAnalyzedAt) {
     const elapsedMinutes = (Date.now() - new Date(asset.ai.lastAnalyzedAt).getTime()) / (1000 * 60);
     if (elapsedMinutes < cooldownMinutes) {
       return { ...asset.ai, source: 'cached', cached: true };
     }
   }
   ```
3. Auto-selects model via `getAvailableOllamaModel()`.
4. Posts request to `http://127.0.0.1:11434/api/generate` (45s timeout).
5. On success: executes `parseAIResponse()`.
6. On error/timeout: falls back to `calculateHeuristicHealth()` with `source: 'heuristic_fallback'`.
7. **Persistence**:
   - Saves `asset.ai = updatedAi`.
   - Appends data point to `asset.healthHistory` (capped at 30 entries).
   - Saves `asset.save()`.
8. Logs audit entry via `logAudit()`.

---

## 3. End-to-End Execution Flow Diagram

```
[Client UI: AssetDetail.jsx]
       │
       │ POST /api/assets/:id/analyze-ai
       ▼
[asset.controller.js: analyzeAssetAI]
       │
       ▼
[ai.service.js: analyzeAssetHealth]
       │
       ├──► 1. gatherAssetContext() ──► Queries Asset, Ticket, Assignment, Warranty Models
       │
       ├──► 2. Check Cooldown (15m) ──► Return cached result if unforced & fresh
       │
       ├──► 3. getAvailableOllamaModel() ──► Auto-discover local model (qwen2.5:3b, llama3.1)
       │
       ├──► 4. buildPrompt() ──► Sanitize inputs & construct JSON prompt
       │
       ├──► 5. HTTP POST http://127.0.0.1:11434/api/generate (Timeout: 45s)
       │         │
       │         ├──► [Success] ──► parseAIResponse() ──► Apply Hallucination Guardrails
       │         │
       │         └──► [Error/Timeout] ──► calculateHeuristicHealth() (Deterministic Fallback)
       │
       ├──► 6. Update Asset MongoDB Document (asset.ai & asset.healthHistory capped at 30)
       │
       └──► 7. logAudit() ──► Record analysis event in Audit Collection
```

---

## 4. Frontend AI Components

- [`HealthScoreBadge.jsx`](file:///c:/Projects/assetIQ-v2/frontend/src/components/ui/HealthScoreBadge.jsx): Displays color-coded health badges (Green: 80-100 Healthy, Yellow: 50-79 Attention, Red: 0-49 Critical) with animated score bars.
- [`AssetDetail.jsx`](file:///c:/Projects/assetIQ-v2/frontend/src/pages/shared/AssetDetail.jsx): Features "Run AI Health Evaluation" button, displaying health scores, failure risk percentages, remaining useful life estimates, next predicted maintenance dates, and AI diagnostic insights.
