import { App, Modal } from 'obsidian';
import { ActivityData } from './types';
import  ActivityHeatmapPlugin  from './main';
import * as React from 'react';
import { Root, createRoot } from "react-dom/client";
import  Heatmap  from './heatmap';

export class HeatmapModal extends Modal {
    private root: Root;
    private plugin: ActivityHeatmapPlugin;

    constructor(app: App, plugin: ActivityHeatmapPlugin) {
        super(app);
        this.plugin = plugin;
        this.root = createRoot(this.containerEl.children[1]);

    }

    async onOpen() {
        //const root = createRoot(this.containerEl.children[1]);
        
        const data = await this.plugin.dataManager.getActivityHeatmapData(this.plugin.settings.useMockData, this.plugin.settings.metricType);
        this.root.render(<Heatmap data={data} metricType={this.plugin.settings.metricType} />);
        
    }

    onClose() {
        if (this.root) {
            this.root.unmount();
          }
    }
}
