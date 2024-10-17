import { App, Modal, Setting } from 'obsidian';
import { ActivityHeatmapSettings } from './types';
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
        this.setTitle('Activity Heatmap');
    }

    async onOpen() {
        const { contentEl } = this;
        
        this.modalEl.style.width = '80vw';
        contentEl.style.display = 'flex';
        contentEl.style.flexDirection = 'column';
        contentEl.style.justifyContent = 'center';
        contentEl.style.alignItems = 'center';

        const settingsContainer = contentEl.createDiv();        

        new Setting(settingsContainer)
            .setName('Metric Type')
            .addDropdown(dropdown => dropdown
                .addOption('fileSize', 'File Size')
                .addOption('wordCount', 'Word Count')
                .setValue(this.plugin.settings.metricType)
                .onChange(async (value) => {
                    this.plugin.settings.metricType = value as ActivityHeatmapSettings['metricType'];
                    await this.plugin.saveSettings();
                    this.renderHeatmap();
                })
            );

        //TODO: Add proper logic for determining years
        //TODO: Add logic for selecting a year (refresh heatmap)
        new Setting(settingsContainer)
            .setName('Year')
            .addDropdown(dropdown => dropdown
                .addOption('2024', '2024')
                .addOption('2023', '2023')
                    );


        const reactContainer = contentEl.createDiv();
        this.root = createRoot(reactContainer);

        await this.renderHeatmap();
    }

    async renderHeatmap() {
        const data = await this.plugin.dataManager.getActivityHeatmapData(this.plugin.settings.useMockData, this.plugin.settings.metricType);
        this.root.render(<Heatmap data={data} metricType={this.plugin.settings.metricType} />);
    }

    onClose() {
        if (this.root) {
            this.root.unmount();
        }
    }
}
