import { Plugin, WorkspaceLeaf } from 'obsidian';
import type { ActivityHeatmapSettings } from './types'
import { ActivityHeatmapDataManager } from './dataManager'
import { DEFAULT_SETTINGS } from './constants'
import { ActivityHeatmapSettingTab } from './settings'
import { HeatmapController } from './heatmapController';
import { HeatmapView, VIEW_TYPE_HEATMAP } from './heatmapView';

export default class ActivityHeatmapPlugin extends Plugin {
	settings: ActivityHeatmapSettings;
	dataManager: ActivityHeatmapDataManager;
	heatmapController: HeatmapController;
	private updateInterval: number;

	async onload() {
		await this.loadSettings();
		console.log("Loading ActivityHeatmapPlugin");
		this.dataManager = new ActivityHeatmapDataManager(this);
		console.log("DataManager created");
		this.heatmapController = new HeatmapController(this.dataManager, this.createHeatmapContainer());
		console.log("HeatmapController created");

		// Add settings tab
		this.addSettingTab(new ActivityHeatmapSettingTab(this.app, this));

		// Set up the interval based on settings
		this.setUpdateInterval();

		// Register the custom view
		this.registerView(
			VIEW_TYPE_HEATMAP,
			(leaf: WorkspaceLeaf) => new HeatmapView(leaf, this.heatmapController)
		);

		// Add ribbon icon and command to access the heatmap
		this.addRibbonIcon('calendar', 'Activity Heatmap', () => {
			this.activateView();
		});

		this.addCommand({
			id: 'open-heatmap-view',
			name: 'Open Activity Heatmap',
			callback: () => this.activateView(),
		});
	}

	async onunload() {
		console.log("Unloading ActivityHeatmapPlugin");
		if (this.updateInterval) {
			window.clearInterval(this.updateInterval);
		}
		await this.dataManager.saveData();
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_HEATMAP);
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
		}, this.settings.updateInterval * 60 * 1000);
		this.registerInterval(this.updateInterval);
		console.log("Update interval set to " + this.settings.updateInterval + " minute(s)");
	}

	private updateMetrics() {
		console.log("Updating metrics");
		this.dataManager.updateMetrics().catch(error => {
			console.error("Error updating metrics:", error);
		});
	}

	async activateView() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_HEATMAP);

		await this.app.workspace.getRightLeaf(false)?.setViewState({
			type: VIEW_TYPE_HEATMAP,
			active: true,
		});

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_TYPE_HEATMAP)[0]
		);
	}

	private createHeatmapContainer(): HTMLElement {
		const container = document.createElement('div');
		container.id = 'heatmap-container';
		return container;
	}
}




