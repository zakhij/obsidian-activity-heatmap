import { Plugin, ViewStateResult, WorkspaceLeaf } from 'obsidian';
import type { ActivityHeatmapSettings } from './types'
import { ActivityHeatmapDataManager } from './dataManager'
import { DEFAULT_SETTINGS } from './constants'
import { ActivityHeatmapSettingTab } from './settings'
import { HeatmapModal } from './heatmapModal';
import type { ActivityHeatmapData } from './types';


export default class ActivityHeatmapPlugin extends Plugin {
	settings: ActivityHeatmapSettings;
	dataManager: ActivityHeatmapDataManager;
	private updateInterval: number;

	async onload() {
		await this.loadSettings();
		console.log("Loading ActivityHeatmapPlugin");
		this.dataManager = new ActivityHeatmapDataManager(this,await this.loadData() ?? { checkpoints: {}, activityOverTime: {} });
		console.log("DataManager created");

		// Add settings tab
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
		console.log("Update interval set to " + this.settings.updateIntervalSeconds + " second(s)");
	}

	private updateMetrics() {
		console.log("Updating metrics");
		this.dataManager.updateMetrics();
	}

}




