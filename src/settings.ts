import { App, PluginSettingTab, Setting } from 'obsidian'
import ActivityHeatmapPlugin from './main'
import { DEV_BUILD } from './config';

export class ActivityHeatmapSettingTab extends PluginSettingTab {
	plugin: ActivityHeatmapPlugin;

	constructor(app: App, plugin: ActivityHeatmapPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		containerEl.createEl('p', {
			text: 'Metric type and year options are available directly in the heatmap modal.'
		});

		if (DEV_BUILD) {
			new Setting(containerEl)
				.setName('Use mock data')
				.setDesc('Toggle to use mock data for the heatmap. FOR DEV TESTING ONLY.')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.useMockData || false)
					.onChange(async (value) => {
						this.plugin.settings.useMockData = value;
						await this.plugin.saveSettings();
					})
				);
		}
	}
}
