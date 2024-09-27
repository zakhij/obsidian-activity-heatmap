import { ItemView, WorkspaceLeaf } from 'obsidian';
import ActivityHeatmapPlugin from './main';
import { ActivityData } from './types';
import * as React from 'react';
import { Root, createRoot } from "react-dom/client";
import  Heatmap  from './heatmap';

export const VIEW_TYPE_HEATMAP = 'heatmap-view';

export class HeatmapView extends ItemView {

    private plugin: ActivityHeatmapPlugin;
    private root: Root | null = null;


    constructor(leaf: WorkspaceLeaf, plugin: ActivityHeatmapPlugin) {
        super(leaf);
        this.plugin = plugin;

    }

    getViewType() {
        return VIEW_TYPE_HEATMAP;
    }

    getDisplayText() {
        return 'Activity Heatmap';
    }

    async onOpen() {
        console.log("Opening heatmap view, using mock data:", this.plugin.settings.useMockData);
        const root = createRoot(this.containerEl.children[1]);
        
        const data = await this.getHeatmapData();
        root.render(<Heatmap data={data} />);

    }

    async getHeatmapData(): Promise<ActivityData> {
        const metricType = this.plugin.settings.metricType;
        return this.plugin.dataManager.getActivityHeatmapData(this.plugin.settings.useMockData, metricType);
    }

    async onClose() {
        // Cleanup if necessary
    }
}

