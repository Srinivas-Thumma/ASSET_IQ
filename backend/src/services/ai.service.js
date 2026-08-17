import axios from 'axios';
import Asset from '../models/Asset.js';
import Ticket from '../models/Ticket.js';
import Assignment from '../models/Assignment.js';
import Warranty from '../models/Warranty.js';
import Category from '../models/Category.js';
import ApiError from '../utils/ApiError.js';
import { logAudit } from './audit.service.js';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_URL = `${OLLAMA_BASE_URL}/api/generate`;

let cachedModel = null;
let lastModelCheck = 0;

/**
 * Detect available installed Ollama models on local machine
 */
export const getAvailableOllamaModel = async () => {
  const now = Date.now();
  if (cachedModel && now - lastModelCheck < 60000) {
    return cachedModel;
  }

  if (process.env.OLLAMA_MODEL) {
    cachedModel = process.env.OLLAMA_MODEL;
    lastModelCheck = now;
    return cachedModel;
  }

  try {
    const tagsUrl = `${OLLAMA_BASE_URL}/api/tags`;
    const res = await axios.get(tagsUrl, { timeout: 3000 });
    const models = (res.data?.models || []).map((m) => m.name || m.model);

    if (models.length > 0) {
      // Find preferred model in order of capability and speed
      const preferred = [
        'qwen2.5:3b',
        'qwen2.5:7b',
        'qwen2.5',
        'llama3.1:8b',
        'llama3.1',
        'mistral:latest',
        'mistral',
        'llama2:latest',
        'llama2',
        'deepseek-r1:1.5b'
      ];

      for (const p of preferred) {
        const match = models.find((m) => m === p || m.startsWith(p) || m.includes(p));
        if (match) {
          cachedModel = match;
          lastModelCheck = now;
          console.log(`[AI Engine] Auto-selected local Ollama model: ${cachedModel}`);
          return cachedModel;
        }
      }

      cachedModel = models[0];
      lastModelCheck = now;
      console.log(`[AI Engine] Selected first available Ollama model: ${cachedModel}`);
      return cachedModel;
    }
  } catch (err) {
    console.warn(`[AI Engine] Could not query Ollama tags (${err.message}), defaulting to 'qwen2.5:3b'`);
  }

  cachedModel = 'qwen2.5:3b';
  lastModelCheck = now;
  return cachedModel;
};

/**
 * Gather all intelligence about an asset for the LLM
 */
export const gatherAssetContext = async (assetId, organizationId) => {
  const asset = await Asset.findOne({ _id: assetId, organizationId })
    .populate('categoryId', 'name expectedLifespanMonths')
    .populate('vendorId', 'name')
    .populate('locationId', 'name');

  if (!asset) throw new ApiError(404, 'Asset not found');

  // Query all tickets related to this asset
  const tickets = await Ticket.find({
    assetId,
    organizationId
  }).sort({ createdAt: -1 });

  const repairTickets = tickets.filter((t) => t.type === 'repair' || t.issueType === 'hardware');
  const openRepairTickets = repairTickets.filter((t) => ['open', 'claimed', 'in_progress'].includes(t.status));
  const resolvedRepairs = repairTickets.filter((t) => ['resolved', 'closed'].includes(t.status));
  const totalRepairCost = repairTickets.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
  const lastRepair = resolvedRepairs[0] || repairTickets[0];

  // Assignment history
  const assignments = await Assignment.find({ assetId, organizationId })
    .populate('employeeId', 'firstName lastName')
    .sort({ assignedAt: -1 });

  // Warranty
  const warranty = await Warranty.findOne({ assetId, organizationId }).sort({ endDate: -1 });

  // Age calculation
  const ageInMonths = asset.purchaseDate 
    ? Math.max(0, Math.floor((Date.now() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 30.4375)))
    : 0;

  const expectedLifespan = asset.categoryId?.expectedLifespanMonths || 36;

  return {
    asset,
    ageInMonths,
    expectedLifespan,
    repairCount: repairTickets.length,
    openRepairCount: openRepairTickets.length,
    totalRepairCost,
    lastRepairDate: lastRepair?.resolvedAt || lastRepair?.createdAt || null,
    assignmentCount: assignments.length,
    warrantyStatus: warranty ? (new Date(warranty.endDate) > Date.now() ? 'active' : 'expired') : 'none',
    warrantyEndDate: warranty?.endDate || null,
    currentAssignment: assignments.find((a) => !a.returnedAt) || null,
    context: {
      name: asset.name,
      category: asset.categoryId?.name || 'General Hardware',
      purchaseDate: asset.purchaseDate,
      ageInMonths,
      expectedLifespan,
      purchasePrice: asset.purchasePrice || 0,
      status: asset.status,
      repairCount: repairTickets.length,
      openRepairCount: openRepairTickets.length,
      totalTicketsCount: tickets.length,
      totalRepairCost,
      lastRepairDate: lastRepair?.resolvedAt || lastRepair?.createdAt || null,
      warrantyStatus: warranty ? (new Date(warranty.endDate) > Date.now() ? 'active' : 'expired') : 'none',
      assignmentCount: assignments.length,
    }
  };
};

/**
 * Sanitize text inputs for safe LLM prompt interpolation
 */
const sanitizePromptInput = (val, maxLen = 80) => {
  if (!val) return 'None';
  return String(val)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[{}<>"\\]/g, '')
    .trim()
    .slice(0, maxLen);
};

/**
 * Build the prompt for the LLM
 */
export const buildPrompt = (context) => {
  const safeName = sanitizePromptInput(context.name, 60);
  const safeCategory = sanitizePromptInput(context.category, 40);
  const safeStatus = sanitizePromptInput(context.status, 20);
  const baseline = calculateHeuristicHealth(context);

  return `You are an expert IT asset health analysis AI. Analyze the following physical IT hardware data and output a realistic JSON health evaluation.

EQUIPMENT DATA:
- Name: ${safeName}
- Category: ${safeCategory}
- Purchase Date: ${context.purchaseDate ? new Date(context.purchaseDate).toISOString().split('T')[0] : 'Unknown'}
- Operational Age: ${Number(context.ageInMonths) || 0} months
- Manufacturer Lifespan: ${Number(context.expectedLifespan) || 36} months
- Fleet Status: ${safeStatus}
- Past Repair Tickets: ${Number(context.repairCount) || 0}
- Active Defect Issues: ${Number(context.openRepairCount) || 0}
- Total Repair Cost: $${Number(context.totalRepairCost) || 0}
- Baseline Telemetry Estimate: ${baseline.healthScore}% (${baseline.replacementRecommendation})
- Warranty: ${sanitizePromptInput(context.warrantyStatus, 20)}

SCORING INSTRUCTIONS:
- Pristine equipment (0-6 months, 0 tickets, in stock/assigned): Output healthScore 85-100, recommendation "keep".
- Normal operating equipment (50-80% lifespan): Output healthScore 50-75, recommendation "keep" or "repair".
- Broken / In repair status / Active defect issues: Output healthScore 15-45, recommendation "repair" or "replace".
- Overdue past lifespan / Retired: Output healthScore 5-35, recommendation "replace".

Return ONLY a valid JSON object matching this schema:
{
  "healthScore": ${baseline.healthScore},
  "failureRiskPercent": ${baseline.failureRiskPercent},
  "remainingUsefulLifeMonths": ${baseline.remainingUsefulLifeMonths},
  "predictedNextMaintenanceDate": "${baseline.predictedNextMaintenanceDate}",
  "insights": ["Specific diagnostic insight based on actual age and condition", "Specific maintenance advice"],
  "replacementRecommendation": "${baseline.replacementRecommendation}"
}`;
};

/**
 * Heuristic fallback calculation if Ollama is not running or unreachable
 */
export const calculateHeuristicHealth = (context) => {
  const { ageInMonths = 0, expectedLifespan = 36, repairCount = 0, openRepairCount = 0, warrantyStatus = 'none', status = 'stock' } = context;

  // Base score calculation based on age vs lifespan
  const ageRatio = expectedLifespan > 0 ? ageInMonths / expectedLifespan : 0.1;
  let healthScore = Math.round(100 - (Math.min(1.5, ageRatio) * 55));

  // Deductions for past and active repairs
  healthScore -= (repairCount * 8);
  healthScore -= (openRepairCount * 18);

  // Warranty penalty
  if (warrantyStatus === 'expired') {
    healthScore -= 8;
  }

  // Status penalty
  if (status === 'repair') {
    healthScore = Math.min(healthScore, 42);
    healthScore -= 12;
  } else if (status === 'retired') {
    healthScore = 5;
  }

  // Clamp 5 - 100
  healthScore = Math.max(5, Math.min(100, healthScore));

  const failureRiskPercent = Math.max(0, Math.min(95, 100 - healthScore + (repairCount * 6) + (openRepairCount * 12)));
  const remainingUsefulLifeMonths = Math.max(0, Math.round(Math.max(0, expectedLifespan - ageInMonths) * (healthScore / 100)));

  const nextMaintMonths = Math.max(1, Math.round((healthScore / 100) * 10));
  const nextDate = new Date();
  nextDate.setMonth(nextDate.getMonth() + nextMaintMonths);
  const predictedNextMaintenanceDate = nextDate.toISOString().split('T')[0];

  let replacementRecommendation = 'keep';
  if (healthScore < 45 || ageInMonths > expectedLifespan || status === 'retired') {
    replacementRecommendation = 'replace';
  } else if (healthScore < 70 || status === 'repair' || repairCount >= 2 || openRepairCount > 0) {
    replacementRecommendation = 'repair';
  }

  const insights = [];
  if (status === 'retired') {
    insights.push('Device has been decommissioned from active production fleet');
    insights.push('Hardware has reached end-of-life; replace or salvage components');
  } else if (status === 'repair' || openRepairCount > 0) {
    insights.push('Hardware is currently flagged with active defect tickets');
    insights.push('Requires physical inspection or part replacement before redeployment');
  } else if (ageInMonths > expectedLifespan) {
    insights.push(`Exceeded manufacturer planned lifespan of ${expectedLifespan} months (Current age: ${ageInMonths}m)`);
    insights.push('Elevated component fatigue risk; schedule procurement replacement');
  } else if (ageRatio >= 0.7) {
    insights.push(`Operating in late-lifecycle phase (${Math.round(ageRatio * 100)}% of lifespan consumed)`);
    insights.push(warrantyStatus === 'active' ? 'Protected by active OEM warranty' : 'Out of warranty coverage');
  } else if (ageInMonths < 6 && repairCount === 0) {
    insights.push('Device in pristine early-lifecycle operating phase');
    insights.push('Zero past failure events recorded');
  } else {
    insights.push(`Operating at ${Math.round(ageRatio * 100)}% of useful lifecycle`);
    insights.push(repairCount > 0 ? `Logged ${repairCount} past maintenance ticket(s)` : 'Clean service history');
  }

  return {
    healthScore,
    failureRiskPercent,
    remainingUsefulLifeMonths,
    predictedNextMaintenanceDate,
    insights,
    replacementRecommendation
  };
};

/**
 * Parse LLM response — handle various JSON formats and markdown code fences
 */
export const parseAIResponse = (rawText, fallbackContext) => {
  try {
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    const cleanText = jsonMatch ? jsonMatch[1].trim() : rawText.trim();
    
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      const jsonSubstr = cleanText.substring(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(jsonSubstr);

      if (typeof parsed.healthScore === 'number' && !isNaN(parsed.healthScore)) {
        let healthScore = Math.max(0, Math.min(100, Math.round(parsed.healthScore)));

        // Guardrails against LLM hallucination / fixed template copying
        if (fallbackContext.status === 'repair' || fallbackContext.openRepairCount > 0) {
          if (healthScore > 48) {
            healthScore = Math.min(42, calculateHeuristicHealth(fallbackContext).healthScore);
          }
        }

        if (fallbackContext.status === 'retired') {
          healthScore = 5;
        }

        if (fallbackContext.expectedLifespan > 0 && fallbackContext.ageInMonths > fallbackContext.expectedLifespan * 1.3) {
          if (healthScore > 48) {
            healthScore = Math.min(42, calculateHeuristicHealth(fallbackContext).healthScore);
          }
        }

        // Ensure logical consistency between health score and risk / recommendations
        let failureRiskPercent = typeof parsed.failureRiskPercent === 'number' && !isNaN(parsed.failureRiskPercent)
          ? Math.max(0, Math.min(100, Math.round(parsed.failureRiskPercent)))
          : Math.max(0, 100 - healthScore);

        if (healthScore >= 75 && failureRiskPercent > 35) {
          failureRiskPercent = Math.max(2, 100 - healthScore);
        }

        let recommendation = ['keep', 'repair', 'replace'].includes(parsed.replacementRecommendation)
          ? parsed.replacementRecommendation
          : (healthScore < 45 ? 'replace' : (healthScore < 70 ? 'repair' : 'keep'));

        if (healthScore >= 75 && recommendation === 'replace' && fallbackContext.status !== 'retired') {
          recommendation = 'keep';
        } else if (healthScore <= 35 && recommendation === 'keep') {
          recommendation = fallbackContext.status === 'repair' ? 'repair' : 'replace';
        }

        return {
          healthScore,
          failureRiskPercent,
          remainingUsefulLifeMonths: typeof parsed.remainingUsefulLifeMonths === 'number' && !isNaN(parsed.remainingUsefulLifeMonths)
            ? Math.max(0, Math.round(parsed.remainingUsefulLifeMonths))
            : Math.max(0, Math.round((fallbackContext.expectedLifespan - fallbackContext.ageInMonths) * (healthScore / 100))),
          predictedNextMaintenanceDate: parsed.predictedNextMaintenanceDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          insights: Array.isArray(parsed.insights) && parsed.insights.length > 0 ? parsed.insights.map(String) : ['AI evaluation complete'],
          replacementRecommendation: recommendation
        };
      }
    }
  } catch (err) {
    console.warn('⚠️ Could not parse Ollama JSON response, using heuristic fallback:', err.message);
  }

  return calculateHeuristicHealth(fallbackContext);
};

/**
 * Main function to analyze asset health using Ollama with heuristic fallback
 */
export const analyzeAssetHealth = async (assetId, organizationId, user, options = {}) => {
  const { force = false, cooldownMinutes = 15 } = options;
  const { asset, context } = await gatherAssetContext(assetId, organizationId);

  // Check analysis cache & cooldown (only if not forced and asset has already been analyzed with a non-null health score)
  if (!force && asset.ai?.lastAnalyzedAt && typeof asset.ai?.healthScore === 'number') {
    const elapsedMinutes = (Date.now() - new Date(asset.ai.lastAnalyzedAt).getTime()) / (1000 * 60);
    if (elapsedMinutes < cooldownMinutes) {
      return {
        ...(asset.ai.toObject ? asset.ai.toObject() : asset.ai),
        source: 'cached',
        cached: true,
        cooldownRemainingSeconds: Math.round((cooldownMinutes - elapsedMinutes) * 60)
      };
    }
  }

  const prompt = buildPrompt(context);

  let aiResult = null;
  let source = 'ollama';

  const selectedModel = await getAvailableOllamaModel();

  try {
    // Call Ollama local server with IPv4 and selected model
    const response = await axios.post(
      OLLAMA_URL,
      {
        model: selectedModel,
        prompt,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.2,
          top_p: 0.9
        }
      },
      { timeout: 45000 }
    );

    const rawResponse = response.data?.response || '';
    aiResult = parseAIResponse(rawResponse, context);
    console.log(`[AI Engine] Successfully generated health evaluation for ${asset.name} via ${selectedModel} (Score: ${aiResult.healthScore}%)`);
  } catch (ollamaErr) {
    console.warn(`[AI Health] Ollama local API unavailable or model failed (${ollamaErr.message}). Utilizing intelligent heuristic engine.`);
    aiResult = calculateHeuristicHealth(context);
    source = 'heuristic_fallback';
  }

  // Update asset with analysis results
  const updatedAi = {
    ...aiResult,
    lastAnalyzedAt: new Date()
  };

  asset.ai = updatedAi;
  if (!asset.healthHistory) asset.healthHistory = [];
  asset.healthHistory.push({
    score: aiResult.healthScore,
    date: new Date()
  });
  if (asset.healthHistory.length > 30) {
    asset.healthHistory = asset.healthHistory.slice(-30);
  }
  await asset.save();

  await logAudit({
    actorId: user._id,
    actorRole: user.role,
    action: 'ai_health_analyzed',
    targetType: 'asset',
    targetId: asset._id,
    metadata: {
      healthScore: aiResult.healthScore,
      recommendation: aiResult.replacementRecommendation,
      engine: source,
      model: selectedModel
    },
    organizationId: organizationId
  });

  return {
    ...updatedAi,
    source,
    model: selectedModel
  };
};

export default {
  gatherAssetContext,
  buildPrompt,
  calculateHeuristicHealth,
  parseAIResponse,
  analyzeAssetHealth,
  getAvailableOllamaModel
};
