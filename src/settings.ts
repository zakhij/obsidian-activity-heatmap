
import { App, PluginSettingTab, Setting } from 'obsidian'
import ActivityHeatmapPlugin from './main'


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
                    this.plugin.settings.metricType = value as 'fileSize' | 'wordCount';
                    await this.plugin.saveSettings();
                    //IN FUTURE: this.plugin.updateHeatmap();
                })
            );
		

		new Setting(containerEl)
			.setName('Use Mock Data')
			.setDesc('Toggle to use mock data for the heatmap. FOR DEV TESTING.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useMockData)
				.onChange(async (value) => {
					this.plugin.settings.useMockData = value as boolean;
					await this.plugin.saveSettings();
				})
			);
	}
}