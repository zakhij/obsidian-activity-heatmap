import { Plugin } from 'obsidian';
import type { ActivityHeatmapSettings } from './types'
import { ActivityHeatmapDataManager } from './dataManager'
import { DEFAULT_SETTINGS } from './constants'
import { ActivityHeatmapSettingTab } from './settings'
import { HeatmapModal } from './heatmapModal';
import { DEV_BUILD } from './config';


export default class ActivityHeatmapPlugin extends Plugin {
	settings: ActivityHeatmapSettings;
	dataManager: ActivityHeatmapDataManager;
	private updateInterval: number;

	async onload() {
		await this.loadSettings();
		console.log("Loading ActivityHeatmapPlugin");
		this.dataManager = new ActivityHeatmapDataManager(this,await this.loadData() ?? { checkpoints: {}, activityOverTime: {} });

		this.addSettingTab(new ActivityHeatmapSettingTab(this.app, this));

		this.setUpdateInterval();

		this.addCommand({
			id: 'open-heatmap-modal',
			name: 'Open Heatmap',
			callback: () => {
				new HeatmapModal(this.app, this).open();
			}
		});

		this.addRibbonIcon('calendar', 'Open Heatmap', (evt: MouseEvent) => {
			new HeatmapModal(this.app, this).open();
		});

	}

	async onunload() {
		console.log("Unloading ActivityHeatmapPlugin");
		if (this.updateInterval) {
			window.clearInterval(this.updateInterval);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		if (!DEV_BUILD) {
			delete this.settings.useMockData;
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.setUpdateInterval(); 
	}

	private setUpdateInterval() { 
		if (this.updateInterval) {
			window.clearInterval(this.updateInterval);
		}
		this.updateInterval = window.setInterval(() => {
			this.updateMetrics();
		}, this.settings.updateIntervalSeconds * 1000);
		this.registerInterval(this.updateInterval);
	}

	private updateMetrics() {
		console.log("Updating metrics");
		this.dataManager.updateMetrics();
	}

}




