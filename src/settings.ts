
import { App, PluginSettingTab, Setting } from 'obsidian'
import ActivityHeatmapPlugin from './main'
import { ActivityHeatmapSettings } from './types';


export class ActivityHeatmapSettingTab extends PluginSettingTab {
	plugin: ActivityHeatmapPlugin;

	constructor(app: App, plugin: ActivityHeatmapPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
            .setName('Metric Type')
            .setDesc('Choose the metric to use for the activity heatmap')
            .addDropdown(dropdown => dropdown
                .addOption('fileSize', 'File Size')
                .addOption('wordCount', 'Word Count')
                .setValue(this.plugin.settings.metricType)
                .onChange(async (value) => {
                    this.plugin.settings.metricType = value as ActivityHeatmapSettings['metricType'];
                    await this.plugin.saveSettings();
                })
            );
		

		new Setting(containerEl)
			.setName('Use Mock Data')
			.setDesc('Toggle to use mock data for the heatmap. FOR DEV TESTING.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useMockData)
				.onChange(async (value) => {
					this.plugin.settings.useMockData = value as ActivityHeatmapSettings['useMockData'];
					await this.plugin.saveSettings();
				})
			);
	}
}