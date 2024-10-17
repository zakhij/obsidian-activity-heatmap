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
        //this.root = createRoot(this.containerEl.children[1]);
        this.setTitle('Activity Heatmap');
    }

    async onOpen() {
        const { contentEl } = this;
        // Set a larger size for the modal
        this.modalEl.style.width = '80vw';
        //this.modalEl.style.height = '80vh';
        
        contentEl.style.display = 'flex';
        contentEl.style.flexDirection = 'column';
        contentEl.style.justifyContent = 'center';
        contentEl.style.alignItems = 'center';
        //this.contentEl.style.height = '100%';

        const settingsContainer = contentEl.createDiv();        

        new Setting(settingsContainer)
            .setName('Metric Type')
            .addDropdown(dropdown => dropdown
                .addOption('fileSize', 'File Size')
                .addOption('wordCount', 'Word Count')
                .onChange((value) => {
                    this.plugin.settings.metricType = value as ActivityHeatmapSettings['metricType'];
                    this.plugin.saveSettings();
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

        const data = await this.plugin.dataManager.getActivityHeatmapData(this.plugin.settings.useMockData, this.plugin.settings.metricType);
        this.root.render(<Heatmap data={data} metricType={this.plugin.settings.metricType} />);
    }

    onClose() {
        if (this.root) {
            this.root.unmount();
        }
    }
}
