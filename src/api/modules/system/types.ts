export interface SystemConfig {
  claim_validity_days: number
  feedback_types: string[]
  item_types: string[]
  publish_limit: number
}

export interface UpdateFeedbackTypesRequest {
  feedback_types: string[]
}

export interface UpdateItemTypesRequest {
  item_types: string[]
}

export interface UpdateClaimValidityDaysRequest {
  claim_validity_days: number
}

export interface UpdatePublishLimitRequest {
  publish_limit: number
}
