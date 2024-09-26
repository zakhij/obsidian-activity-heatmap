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

    render(data: ActivityData) {

        const dataArray = Object.entries(data).map(([date, value]) => ({ date, value }));
        this.cal.paint({
            data: { source: dataArray, x: 'date', y: 'value' },
            date: {start: new Date('2024-06-01')},
            itemSelector: `#${this.containerId}`,
            range: 6,
            domain: {
                type: 'month',
                //gutter: 4,
                //label: { text: 'MMM', textAlign: 'start' },
            },
            subDomain: {
                type: 'day',
                radius: 2,
                //width: 15,
                //height: 15,
                //gutter: 4,
            },
        });
    }
}

    