import CalHeatmap from 'cal-heatmap';
import 'cal-heatmap/cal-heatmap.css';
import { ActivityData } from './types';
export class Heatmap {
    private cal: CalHeatmap;
    private containerId: string | null = null;

    constructor() {
        this.cal = new CalHeatmap();
        this.containerId = null;
    }

    setContainer(container: HTMLElement) {
        this.containerId = `heatmap-container-${Date.now()}`;
        container.id = this.containerId;
        console.log("Container set with ID:", this.containerId);
    }

    /**
     * Renders the heatmap with the given data.
     * @param data - The historical activity data to render the heatmap with.
     */

    //TODO: Function overhaul!
    render(data: ActivityData) {
        console.log("Render function called with data:", data);
        if (!this.containerId) {
            console.error("Container not set. Call setContainer before rendering.");
            return;
        }

        const container = document.querySelector(`#${this.containerId}`);
        if (!container) {
            console.error("Container not found in DOM");
            return;
        }

        // Clear the container before rendering
        container.innerHTML = '';

        const dataArray = Object.entries(data).map(([date, value]) => ({ date, value }));
        console.log("Formatted data array:", dataArray);

        try {
            this.cal.paint({
                data: {
                    source: dataArray,
                },
                date: {
                    start: new Date(),
                },
                range: 12,
                subDomain: {
                    type: 'day',
                    radius: 2,
                    width: 15,
                    height: 15,
                    gutter: 4,
                },
                domain: {
                    type: 'month',
                    gutter: 4,
                    label: { text: 'MMM', textAlign: 'start' },
                },
                itemSelector: `#${this.containerId}`,
            });

            console.log("Heatmap rendered successfully");
        } catch (error) {
            console.error("Error rendering heatmap:", error);
        }
    }
}
