import { AnalyticsService } from '../src/services/AnalyticsService.js';

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;

  it('should create AnalyticsService instance', () => {
    analyticsService = new AnalyticsService();
    expect(analyticsService).toBeDefined();
  });

  it('should have getCodingPatterns method', () => {
    analyticsService = new AnalyticsService();
    expect(typeof analyticsService.getCodingPatterns).toBe('function');
  });

  it('should have getVelocityMetrics method', () => {
    analyticsService = new AnalyticsService();
    expect(typeof analyticsService.getVelocityMetrics).toBe('function');
  });

  it('should have getCodeQualityMetrics method', () => {
    analyticsService = new AnalyticsService();
    expect(typeof analyticsService.getCodeQualityMetrics).toBe('function');
  });

  it('should return velocity metrics structure', async () => {
    analyticsService = new AnalyticsService();
    const metrics = await analyticsService.getVelocityMetrics();
    expect(metrics).toHaveProperty('totalCommits');
    expect(metrics).toHaveProperty('totalLines');
    expect(metrics).toHaveProperty('avgLinesPerDay');
    expect(metrics).toHaveProperty('avgCommitsPerWeek');
  });

  it('should return code quality metrics structure', () => {
    analyticsService = new AnalyticsService();
    const metrics = analyticsService.getCodeQualityMetrics();
    expect(metrics).toHaveProperty('avgFilesPerCommit');
    expect(metrics).toHaveProperty('largestCommit');
    expect(metrics).toHaveProperty('smallestCommit');
    expect(metrics).toHaveProperty('commitFrequency');
  });
});
