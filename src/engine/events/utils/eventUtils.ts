export const generateEventId = (): string => 
  Math.random().toString(36).substr(2, 9);