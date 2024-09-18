import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

import type { ActivityHeatmapSettings } from './types'

import { DEFAULT_SETTINGS } from './constants'

export default class ActivityHeatmapPlugin extends Plugin {
	settings: ActivityHeatmapSettings;

	async onload() {

		await this.loadSettings();
		
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}




