import { App, Modal, Setting } from 'obsidian';
import { ActivityHeatmapSettings } from './types';
import  ActivityHeatmapPlugin  from './main';
import * as React from 'react';
import { Root, createRoot } from "react-dom/client";
import  Heatmap  from './heatmap';

/**
 * Modal for displaying the activity heatmap.
 */
export class HeatmapModal extends Modal {
    private root: Root;
    private plugin: ActivityHeatmapPlugin;

    /**
     * Creates an instance of HeatmapModal.
     * @param app - The Obsidian app instance.
     * @param plugin - The main plugin instance.
     */
    constructor(app: App, plugin: ActivityHeatmapPlugin) {
        super(app);
        this.plugin = plugin;
        this.setTitle('Activity Heatmap');
    }

    /**
     * Handles the opening of the modal.
     */
    async onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        
        this.modalEl.style.width = '90vw';
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

        new Setting(settingsContainer)
            .setName('Year')
            .addDropdown(async (dropdown) => {
                dropdown.addOption('Past Year', 'Past Year');

                const data = await this.plugin.dataManager.getActivityHeatmapData(this.plugin.settings.metricType);

                const years = Object.keys(data)
                    .map(date => new Date(date).getFullYear())
                    .filter((value, index, self) => self.indexOf(value) === index)
                    .sort((a, b) => b - a); 

                years.forEach(year => {
                    dropdown.addOption(year.toString(), year.toString());
                });

                dropdown.setValue(this.plugin.settings.year);
                dropdown.onChange(async (value) => {
                    this.plugin.settings.year = value as ActivityHeatmapSettings['year'];
                    await this.plugin.saveSettings();
                    this.renderHeatmap();
                });
            });


        const reactContainer = contentEl.createDiv();
        this.root = createRoot(reactContainer);

        await this.renderHeatmap();
    }

    /**
     * Renders the heatmap component.
     */
    async renderHeatmap() {
        const data = await this.plugin.dataManager.getActivityHeatmapData(this.plugin.settings.metricType);
        const { metricType, year } = this.plugin.settings;
        this.root.render(
            <Heatmap 
                data={data} 
                metricType={metricType} 
                year={year} 
            />
        );
    }

    /**
     * Handles the closing of the modal.
     */
    onClose() {
        if (this.root) {
            this.root.unmount();
        }
    }
}
