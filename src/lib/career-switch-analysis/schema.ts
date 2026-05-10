export const ANALYSIS_SCHEMA_NAME = "career_switch_result";

const salaryRangeSchema = {
  type: "object",
  additionalProperties: false,
  required: ["low", "median", "high", "currency"],
  properties: {
    low: { type: "number" },
    median: { type: "number" },
    high: { type: "number" },
    currency: { type: "string", enum: ["UAH"] }
  }
} as const;

export const careerSwitchAnalysisSchema = {
  type: "object",
  additionalProperties: false,
  required: ["market_profile", "narrative", "guidance"],
  properties: {
    market_profile: {
      type: "object",
      additionalProperties: false,
      required: ["current_role", "target_role", "comparison"],
      properties: {
        current_role: {
          type: "object",
          additionalProperties: false,
          required: [
            "canonical_title",
            "market_scope_label",
            "current_level_estimate",
            "current_market_salary_range",
            "senior_salary_range",
            "best_case_level",
            "best_case_salary_range",
            "confidence",
            "caveats",
            "summary"
          ],
          properties: {
            canonical_title: { type: "string" },
            market_scope_label: { type: "string" },
            current_level_estimate: { type: "string", enum: ["junior", "middle", "senior", "lead"] },
            current_market_salary_range: salaryRangeSchema,
            senior_salary_range: salaryRangeSchema,
            best_case_level: { type: "string", enum: ["senior", "lead"] },
            best_case_salary_range: salaryRangeSchema,
            confidence: { type: "number" },
            caveats: { type: "array", items: { type: "string" } },
            summary: { type: "string" }
          }
        },
        target_role: {
          type: "object",
          additionalProperties: false,
          required: [
            "canonical_title",
            "market_scope_label",
            "entry_level_for_switcher",
            "entry_salary_range",
            "senior_salary_range",
            "best_case_level",
            "best_case_salary_range",
            "time_to_first_offer_months",
            "probability_of_getting_job_within_12_months",
            "confidence",
            "caveats",
            "summary"
          ],
          properties: {
            canonical_title: { type: "string" },
            market_scope_label: { type: "string" },
            entry_level_for_switcher: { type: "string", enum: ["junior", "middle", "senior", "lead"] },
            entry_salary_range: salaryRangeSchema,
            senior_salary_range: salaryRangeSchema,
            best_case_level: { type: "string", enum: ["senior", "lead"] },
            best_case_salary_range: salaryRangeSchema,
            time_to_first_offer_months: {
              type: "object",
              additionalProperties: false,
              required: ["optimistic", "base", "pessimistic"],
              properties: {
                optimistic: { type: "number" },
                base: { type: "number" },
                pessimistic: { type: "number" }
              }
            },
            probability_of_getting_job_within_12_months: { type: "number" },
            confidence: { type: "number" },
            caveats: { type: "array", items: { type: "string" } },
            summary: { type: "string" }
          }
        },
        comparison: {
          type: "object",
          additionalProperties: false,
          required: ["better_long_term_direction", "better_long_term_label", "ceiling_gap_median", "interpretation"],
          properties: {
            better_long_term_direction: { type: "string", enum: ["current_role", "target_role", "balanced"] },
            better_long_term_label: { type: "string" },
            ceiling_gap_median: { type: "number" },
            interpretation: { type: "string" }
          }
        }
      }
    },
    narrative: {
      type: "object",
      additionalProperties: false,
      required: [
        "verdict_label",
        "headline",
        "summary",
        "why_this_result",
        "personalization_notes",
        "cta_title",
        "cta_body"
      ],
      properties: {
        verdict_label: { type: "string", enum: ["stay", "switch", "depends"] },
        headline: { type: "string" },
        summary: { type: "string" },
        why_this_result: { type: "array", items: { type: "string" } },
        personalization_notes: { type: "array", items: { type: "string" } },
        cta_title: { type: "string" },
        cta_body: { type: "string" }
      }
    },
    guidance: {
      type: "object",
      additionalProperties: false,
      required: ["risk_assessment"],
      properties: {
        risk_assessment: {
          type: "object",
          additionalProperties: false,
          required: ["level", "summary"],
          properties: {
            level: { type: "string", enum: ["low", "medium", "high"] },
            summary: { type: "string" }
          }
        }
      }
    }
  }
} as const;
