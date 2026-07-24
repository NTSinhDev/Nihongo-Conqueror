export class BaseWorkflowError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends BaseWorkflowError {
  constructor(message: string, details?: any) {
    super("VALIDATION_ERROR", message, details);
  }
}

export class BusinessError extends BaseWorkflowError {
  constructor(message: string, details?: any) {
    super("BUSINESS_ERROR", message, details);
  }
}

export class InfrastructureError extends BaseWorkflowError {
  constructor(message: string, details?: any) {
    super("INFRASTRUCTURE_ERROR", message, details);
  }
}

export class AIError extends BaseWorkflowError {
  constructor(
    message: string,
    details?: any,
    public readonly isRetryable: boolean = true
  ) {
    super("AI_ERROR", message, details);
  }
}

export class FatalError extends BaseWorkflowError {
  constructor(message: string, details?: any) {
    super("FATAL_ERROR", message, details);
  }
}
