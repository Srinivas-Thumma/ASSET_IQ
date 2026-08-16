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

  // Repair history
  const repairs = await Ticket.find({
    assetId,
    organizationId,
    type: 'repair',
    status: { $in: ['resolved', 'closed'] }
  }).sort({ createdAt: -1 });

  const totalRepairCost = repairs.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
  const lastRepair = repairs[0];

  // Assignment history
  const assignments = await Assignment.find({ assetId, organizationId })
    .populate('employeeId', 'firstName lastName')
    .sort({ assignedAt: -1 });

  // Warranty
  const warranty = await Warranty.findOne({ assetId, organizationId }).sort({ endDate: -1 });

  // Age calculation
  const ageInMonths = asset.purchaseDate 
    ? Math.max(0, Math.floor((Date.now() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 30)))
    : 0;

  const expectedLifespan = asset.categoryId?.expectedLifespanMonths || 36;

  return {
    asset,
    ageInMonths,
    expectedLifespan,
    repairCount: repairs.length,
    totalRepairCost,
    lastRepairDate: lastRepair?.resolvedAt || null,
    assignmentCount: assignments.length,
    warrantyStatus: warranty ? (new Date(warranty.endDate) > Date.now() ? 'active' : 'expired') : 'none',
    warrantyEndDate: warranty?.endDate || null,
    currentAssignment: assignments.find(a => !a.returnedAt) || null,
    context: {
      name: asset.name,
      category: asset.categoryId?.name || 'General Hardware',
      purchaseDate: asset.purchaseDate,
      ageInMonths,
      expectedLifespan,
      purchasePrice: asset.purchasePrice || 0,
      status: asset.status,
      repairCount: repairs.length,
      totalRepairCost,
      lastRepairDate: lastRepair?.resolvedAt || null,
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

  return `You are an expert IT asset health analyst. Analyze the following asset data and predict its health status.

ASSET DATA:
- Name: ${safeName}
- Category: ${safeCategory}
- Purchase Date: ${context.purchaseDate ? new Date(context.purchaseDate).toISOString().split('T')[0] : 'Unknown'}
- Age: ${Number(context.ageInMonths) || 0} months
- Expected Lifespan: ${Number(context.expectedLifespan) || 36} months
- Purchase Price: $${Number(context.purchasePrice) || 0}
- Current Status: ${safeStatus}
- Total Repair Tickets: ${Number(context.repairCount) || 0}
- Total Repair Cost: $${Number(context.totalRepairCost) || 0}
- Last Repair Date: ${context.lastRepairDate ? new Date(context.lastRepairDate).toISOString().split('T')[0] : 'Never'}
- Warranty Status: ${sanitizePromptInput(context.warrantyStatus, 20)}
- Number of Previous Assignments: ${Number(context.assignmentCount) || 0}

ANALYSIS RULES:
1. healthScore: Integer 0-100. 100 = perfect, 0 = dead. Consider age vs expected lifespan, repair frequency, warranty status.
2. failureRiskPercent: Integer 0-100. Probability of failure in next 6 months.
3. remainingUsefulLifeMonths: Integer. Estimated months before replacement is needed.
4. predictedNextMaintenanceDate: ISO date string (YYYY-MM-DD). When is the next issue likely?
5. insights: Array of 2-5 concise strings. Each insight should be actionable and specific.
6. replacementRecommendation: One of "keep", "repair", or "replace".

SCORING GUIDELINES:
- New assets (< 6 months, 0 repairs, warranty active): 90-100
- Good condition (age < 50% of lifespan, 0-1 repairs): 70-89
- Fair condition (age 50-75% of lifespan, 2-3 repairs): 50-69
- Poor condition (age > 75% of lifespan, 3+ repairs, warranty expired): 30-49
- Critical (age > 100% of lifespan, frequent repairs, high cost): 0-29

RESPOND WITH ONLY VALID JSON. NO MARKDOWN. NO EXPLANATION. ONLY JSON:

{
  "healthScore": 95,
  "failureRiskPercent": 5,
  "remainingUsefulLifeMonths": 30,
  "predictedNextMaintenanceDate": "2025-06-15",
  "insights": ["Asset in optimal operating condition", "Warranty covers upcoming cycles"],
  "replacementRecommendation": "keep"
}`;
};

/**
 * Heuristic fallback calculation if Ollama is not running or unreachable
 */
export const calculateHeuristicHealth = (context) => {
  const { ageInMonths, expectedLifespan, repairCount, warrantyStatus, status } = context;

  // Base score calculation based on age vs lifespan
  const ageRatio = expectedLifespan > 0 ? Math.min(1.5, ageInMonths / expectedLifespan) : 0.2;
  let healthScore = Math.round(100 - (ageRatio * 60));

  // Deductions for repairs
  healthScore -= (repairCount * 12);

  // Warranty penalty
  if (warrantyStatus === 'expired') {
    healthScore -= 8;
  }

  // Status penalty
  if (status === 'repair') {
    healthScore -= 25;
  } else if (status === 'retired') {
    healthScore = 0;
  }

  // Clamp 0 - 100
  healthScore = Math.max(5, Math.min(100, healthScore));

  const failureRiskPercent = Math.max(0, Math.min(95, 100 - healthScore + (repairCount * 5)));
  const remainingUsefulLifeMonths = Math.max(0, Math.round(Math.max(0, expectedLifespan - ageInMonths) * (healthScore / 100)));

  const nextMaintMonths = Math.max(1, Math.round((healthScore / 100) * 12));
  const nextDate = new Date();
  nextDate.setMonth(nextDate.getMonth() + nextMaintMonths);
  const predictedNextMaintenanceDate = nextDate.toISOString().split('T')[0];

  let replacementRecommendation = 'keep';
  if (healthScore < 40 || ageInMonths > expectedLifespan) {
    replacementRecommendation = 'replace';
  } else if (healthScore < 70 || status === 'repair' || repairCount >= 2) {
    replacementRecommendation = 'repair';
  }

  const insights = [];
  if (ageInMonths < 6 && repairCount === 0) {
    insights.push('Device in pristine early-lifecycle operating phase');
  } else if (ageInMonths > expectedLifespan) {
    insights.push(`Exceeded manufacturer planned lifespan of ${expectedLifespan} months`);
  } else {
    insights.push(`Operating at ${Math.round((ageInMonths / (expectedLifespan || 1)) * 100)}% of useful lifecycle`);
  }

  if (repairCount > 0) {
    insights.push(`Logged ${repairCount} past maintenance ticket(s) - monitored for thermal or wear degradation`);
  } else {
    insights.push('Clean service history with zero hardware repair incidents');
  }

  if (warrantyStatus === 'active') {
    insights.push('Active OEM warranty coverage protects against unexpected failures');
  } else if (warrantyStatus === 'expired') {
    insights.push('OEM warranty coverage expired; prioritize proactive maintenance');
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
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    const cleanText = jsonMatch ? jsonMatch[1].trim() : rawText.trim();
    
    // Find first { and last }
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      const jsonSubstr = cleanText.substring(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(jsonSubstr);

      return {
        healthScore: typeof parsed.healthScore === 'number' ? Math.max(0, Math.min(100, Math.round(parsed.healthScore))) : 85,
        failureRiskPercent: typeof parsed.failureRiskPercent === 'number' ? Math.max(0, Math.min(100, Math.round(parsed.failureRiskPercent))) : 15,
        remainingUsefulLifeMonths: typeof parsed.remainingUsefulLifeMonths === 'number' ? Math.max(0, Math.round(parsed.remainingUsefulLifeMonths)) : 24,
        predictedNextMaintenanceDate: parsed.predictedNextMaintenanceDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        insights: Array.isArray(parsed.insights) && parsed.insights.length > 0 ? parsed.insights.map(String) : ['AI evaluation complete'],
        replacementRecommendation: ['keep', 'repair', 'replace'].includes(parsed.replacementRecommendation) ? parsed.replacementRecommendation : 'keep'
      };
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

  // Check analysis cache & cooldown
  if (!force && asset.ai?.lastAnalyzedAt) {
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
    console.log(`[AI Engine] Successfully generated health evaluation for ${asset.name} via ${selectedModel}`);
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
