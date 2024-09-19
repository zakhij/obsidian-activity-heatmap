import type { MetricData, AllMetricData, ActivityHeatmapData } from './types'
import type ActivityHeatmapPlugin from './main'
import type { TFile } from 'obsidian';

// Abstract class
export abstract class MetricManager {
    public metricName: string;
    constructor() {}

    abstract calculateMetrics(files: TFile[], latestData: ActivityHeatmapData, dateToday: string): { checkpoint: MetricData; activity: MetricData };
}

// Subclass for File Size
export class FileSizeDataManager extends MetricManager {
    constructor() {
        super();
        this.metricName = 'fileSize';
        
    }

    calculateMetrics(files: TFile[], latestData: ActivityHeatmapData, dateToday: string): { checkpoint: MetricData; activity: MetricData } {
        // Implement file size calculation
    }
}

// Subclass for Word Count
export class WordCountDataManager extends MetricManager {
    constructor() {
        super();
        this.metricName = 'wordCount';
    }

    calculateMetrics(files: TFile[], latestData: ActivityHeatmapData, dateToday: string): { checkpoint: MetricData; activity: MetricData } {
        // Implement word count calculation
    }
    
}


// Class Activity Heatmap Data Manager
export class ActivityHeatmapDataManager {
    private data: ActivityHeatmapData;
    private metricManagers: MetricManager[];
    private files: TFile[];

    constructor(private plugin: ActivityHeatmapPlugin) {
        this.data = { checkpoints: {}, activityOverTime: {} };
        this.metricManagers = [
            new FileSizeDataManager(),
            new WordCountDataManager()
        ];

        this.files = this.plugin.app.vault.getMarkdownFiles();
    }

    // Load Data
    async loadData() {
        this.data = await this.plugin.loadData() || { checkpoints: {}, activityOverTime: {} };
    }

    async saveData() {
        await this.plugin.saveData(this.data);
    }

    // Update Metrics
    updateMetrics() {
        const today = new Date().toISOString().split('T')[0];
        for (const manager of this.metricManagers) {
            const { checkpoint, activity } = manager.calculateMetrics(this.files, this.data, today);
            this.data.checkpoints[manager.metricName] = checkpoint;
            this.data.activityOverTime[manager.metricName] = activity;
        }
    }
}
