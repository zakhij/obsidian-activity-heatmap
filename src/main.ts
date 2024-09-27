import { Plugin, ViewStateResult, WorkspaceLeaf } from 'obsidian';
import type { ActivityHeatmapSettings } from './types'
import { ActivityHeatmapDataManager } from './dataManager'
import { DEFAULT_SETTINGS } from './constants'
import { ActivityHeatmapSettingTab } from './settings'
import { HeatmapView, VIEW_TYPE_HEATMAP } from './heatmapView';
import { HeatmapModal } from './heatmapModal';

export default class ActivityHeatmapPlugin extends Plugin {
	settings: ActivityHeatmapSettings;
	dataManager: ActivityHeatmapDataManager;
	private updateInterval: number;

	async onload() {
		await this.loadSettings();
		console.log("Loading ActivityHeatmapPlugin");
		this.dataManager = new ActivityHeatmapDataManager(this);
		console.log("DataManager created");

		// Add settings tab
		this.addSettingTab(new ActivityHeatmapSettingTab(this.app, this));

		// Set up the interval based on settings
		this.setUpdateInterval();

		// Register the custom view
		this.registerView(
			VIEW_TYPE_HEATMAP,
			(leaf: WorkspaceLeaf) => new HeatmapView(leaf, this)
		);

		this.addCommand({
			id: 'open-activity-heatmap',
			name: 'Open Activity Heatmap',
			callback: () => this.activateView(),
		});

		// Add command to open heatmap modal
		this.addCommand({
			id: 'open-heatmap-modal',
			name: 'Open Heatmap',
			callback: () => {
				new HeatmapModal(this.app, this).open();
			}
		});

		// Optionally, add a ribbon icon to open the modal
		this.addRibbonIcon('calendar', 'Open Heatmap', (evt: MouseEvent) => {
			new HeatmapModal(this.app, this).open();
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
		console.log("Activating view");
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_HEATMAP);

		await this.app.workspace.getRightLeaf(false)?.setViewState({
			type: VIEW_TYPE_HEATMAP,
			active: true,
		});
		
		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_TYPE_HEATMAP)[0]
		);
		console.log("View activated");
		
		
	}

}




