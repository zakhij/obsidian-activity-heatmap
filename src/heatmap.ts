import CalHeatMap from 'cal-heatmap';
import 'cal-heatmap/cal-heatmap.css';

export class Heatmap {
    private cal: CalHeatMap;

    constructor(private container: HTMLElement) {
        this.cal = new CalHeatMap();
    }

    render(data: { [date: string]: number }) {
        this.cal.paint({
            itemSelector: this.container,
            domain: 'month',
            subDomain: 'day',
            data: data,
            start: new Date(),
            cellSize: 15,
            range: 3,
            legend: [2, 4, 6, 8, 10],
        });
    }
}
