import { Plugin } from 'obsidian';
import type { ActivityHeatmapData, ActivityHeatmapSettings, MetricType } from './types'
import { ActivityHeatmapDataManager } from './dataManager'
import { DEFAULT_SETTINGS, METRIC_TYPES } from './constants'
import { ActivityHeatmapSettingTab } from './settings'
import { HeatmapModal } from './components/heatmapModal';
import { DEV_BUILD } from './config';
import { TFile } from 'obsidian';
import { isActivityHeatmapData } from './utils';

export default class ActivityHeatmapPlugin extends Plugin {
	settings: ActivityHeatmapSettings;
	dataManager: ActivityHeatmapDataManager;

	async onload() {
		console.log("Loading ActivityHeatmapPlugin");

		await this.loadSettings();
		this.addSettingTab(new ActivityHeatmapSettingTab(this.app, this));

		this.dataManager = new ActivityHeatmapDataManager(this, await this.parseActivityData());

		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					this.dataManager.updateMetricsForFile(file);
				}
			})
		);

		this.registerEvent(
			this.app.vault.on('create', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					console.log("Creating file", file.path);
					this.dataManager.updateMetricsForFile(file);
				}
			})
		);

		this.registerEvent(
			this.app.vault.on('delete', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					this.dataManager.removeFileMetrics(file.path);
				}
			})
		);

		this.addCommand({
			id: 'open-heatmap-modal',
			name: 'Open heatmap',
			callback: () => {
				new HeatmapModal(this.app, this).open();
			}
		});

		this.addRibbonIcon('calendar', 'Open activity heatmap', (evt: MouseEvent) => {
			new HeatmapModal(this.app, this).open();
		});

	}

	async onunload() {
		console.log("Unloading ActivityHeatmapPlugin");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		if (!DEV_BUILD) {
			delete this.settings.useMockData;
		}
	}

	/**
	 * Saves the settings to the data.json file (without overwriting activity data)
	 */
	async saveSettings() {
		const activityData = await this.loadData();
		const dataToSave = {
			...activityData,
			...this.settings
		};
		await this.saveData(dataToSave);
	}

	/**
	 * Parses the activity data from the plugin's data.json file.
	 * @returns The parsed activity data.
	 */
	async parseActivityData(): Promise<ActivityHeatmapData> {
		const loadedData = await this.loadData();

		const emptyFrame: ActivityHeatmapData = {
			checkpoints: METRIC_TYPES.reduce((acc, metric) => ({
				...acc,
				[metric]: {} as Record<string, number>
			}), {} as Record<MetricType, Record<string, number>>),
			activityOverTime: METRIC_TYPES.reduce((acc, metric) => ({
				...acc,
				[metric]: {} as Record<string, number>
			}), {} as Record<MetricType, Record<string, number>>)
		};

		// Case of new user (no data.json)
		if (!loadedData) {
			return emptyFrame;
		}

		// Case of invalid or malformed activity heatmap data
		if (!isActivityHeatmapData(loadedData)) {
			return emptyFrame;
		}

		// Correct case: extract only the ActivityHeatmapData properties
		return {
			checkpoints: loadedData.checkpoints,
			activityOverTime: loadedData.activityOverTime
		};
	}

}




