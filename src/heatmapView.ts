import { ItemView, WorkspaceLeaf } from 'obsidian';
import { HeatmapController } from './heatmapController';

export const VIEW_TYPE_HEATMAP = 'heatmap-view';

export class HeatmapView extends ItemView {
    private heatmapController: HeatmapController;

    constructor(leaf: WorkspaceLeaf, heatmapController: HeatmapController) {
        super(leaf);
        this.heatmapController = heatmapController;
    }

    getViewType() {
        return VIEW_TYPE_HEATMAP;
    }

    getDisplayText() {
        return 'Activity Heatmap';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        await this.heatmapController.updateHeatmap();
    }

    async onClose() {
        // Cleanup if necessary
    }
}
