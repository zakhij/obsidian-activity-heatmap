import { App, Modal } from 'obsidian';
import { ActivityData } from './types';
import  ActivityHeatmapPlugin  from './main';
import * as React from 'react';
import { Root, createRoot } from "react-dom/client";
import  Heatmap  from './heatmap';

export class HeatmapModal extends Modal {
    private root: Root | null = null;
    private plugin: ActivityHeatmapPlugin;

    constructor(app: App, plugin: ActivityHeatmapPlugin) {
        super(app);
        this.plugin = plugin;

    }

    async onOpen() {
        const root = createRoot(this.containerEl.children[1]);
        
        const data = await this.getHeatmapData();
        root.render(<Heatmap data={data} />);
        
    }

    onClose() {
        if (this.root) {
            this.root.unmount();
          }
    }

    private async getHeatmapData(): Promise<ActivityData> {
        const metricType = this.plugin.settings.metricType;
        return this.plugin.dataManager.getActivityHeatmapData(this.plugin.settings.useMockData, metricType);
    }
}
