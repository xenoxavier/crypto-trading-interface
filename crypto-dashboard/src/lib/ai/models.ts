// Available AI models for technical analysis
export const AVAILABLE_MODELS = {
  'anthropic/claude-3.5-sonnet': {
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Excellent for detailed technical analysis',
    cost: '$3/1M tokens'
  },
  'openai/gpt-4o': {
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Advanced reasoning for market analysis',
    cost: '$5/1M tokens'
  },
  'openai/gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    description: 'Fast and accurate analysis',
    cost: '$10/1M tokens'
  },
  'google/gemini-pro-1.5': {
    name: 'Gemini Pro 1.5',
    provider: 'Google',
    description: 'Strong analytical capabilities',
    cost: '$7/1M tokens'
  },
  'meta-llama/llama-3.1-70b-instruct': {
    name: 'Llama 3.1 70B',
    provider: 'Meta',
    description: 'Open source, cost-effective',
    cost: '$0.59/1M tokens'
  },
  'anthropic/claude-3-haiku': {
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    description: 'Fast and affordable analysis',
    cost: '$0.25/1M tokens'
  }
};