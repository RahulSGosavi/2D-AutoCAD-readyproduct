type Sample = {
  name: string;
  duration: number;
  timestamp: number;
};

class PerformanceMonitor {
  private samples: Sample[] = [];

  record(name: string, duration: number) {
    this.samples.push({ name, duration, timestamp: Date.now() });
    if (this.samples.length > 100) {
      this.samples.shift();
    }
  }

  summary() {
    const grouped: Record<string, Sample[]> = {};
    this.samples.forEach((sample) => {
      if (!grouped[sample.name]) grouped[sample.name] = [];
      grouped[sample.name].push(sample);
    });
    return Object.entries(grouped).map(([name, samples]) => {
      const total = samples.reduce((sum, s) => sum + s.duration, 0);
      return {
        name,
        avg: total / samples.length,
        count: samples.length,
      };
    });
  }
}

export const performanceMonitor = new PerformanceMonitor();

