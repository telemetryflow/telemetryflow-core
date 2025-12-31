// Mock for uuid package to handle ES module issues in Jest
let counter = 0;

module.exports = {
  v4: jest.fn(() => `mocked-uuid-v4-${++counter}`),
  v1: jest.fn(() => `mocked-uuid-v1-${++counter}`),
  v3: jest.fn(() => `mocked-uuid-v3-${++counter}`),
  v5: jest.fn(() => `mocked-uuid-v5-${++counter}`),
  validate: jest.fn(() => true),
  version: jest.fn(() => 4),
};