import CalHeatmap from 'cal-heatmap';
import Tooltip from 'cal-heatmap/plugins/Tooltip';
import 'cal-heatmap/cal-heatmap.css';
import LegendLite from 'cal-heatmap/plugins/LegendLite';
import Legend from 'cal-heatmap/plugins/Legend';
import { ActivityData } from './types';
import React, { useEffect, useState } from "react";

const Heatmap: React.FC<{ data: ActivityData}> = ({ data}) => {
    const [cal, setCal] = useState<CalHeatmap | null>(null);

    useEffect(() => {
        const newCal = new CalHeatmap();
        setCal(newCal);
        const dataArray = Object.entries(data).map(([date, value]) => ({ date, value }));
        const maxValue = Math.max(...dataArray.map(item => item.value));

        // Calculate the start date (1 year ago from today)
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        newCal.paint(
            {
                data: { source: dataArray, x: 'date', y: 'value' },
                date: { start: startDate},
                range: 13,
                scale: {
                    color: {
                        type: 'threshold',
                        range: ['#14432a', '#166b34', '#37a446', '#4dd05a'],
                        domain: [0, Math.floor(maxValue / 3), Math.floor((2 * maxValue) / 3), maxValue],
                    },
                },
                domain: {
                    type: 'month',
                    gutter: 3,
                    label: { text: 'MMM', textAlign: 'start', position: 'top' },
                },
                subDomain: { 
                    type: 'ghDay',
                    radius: 2,
                    width: 8,
                    height: 8,
                    gutter: 3
                },
                itemSelector: '#heatmap-container',
            },
            [
                [
                    Tooltip,
                    {
                        text: function(date: any, value: any, dayjsDate: any) {

                            return value ? `${value} contributions on ${dayjsDate.format('MMMM D, YYYY')}` : `No contributions on ${dayjsDate.format('MMMM D, YYYY')}`;
                        }
                    }
                ],
                [
                    LegendLite,
                    {
                        itemSelector: '#heatmap-legend',
                        label: 'Contributions',
                        includeBlank: true,
                    }
                ],
            ]
        );



        return () => {
            newCal.destroy();
        };
    }, [data]);

    return (
        <div>
            <div id="heatmap-container"></div>
            <div style={{ float: 'left', fontSize: 11, marginTop: '5px' }}>
            Less
            <div
                id="heatmap-legend"
                style={{ display: 'inline-block', margin: '0 8px' }}
            ></div>
            More
            </div>


        </div>
    );
}

export default Heatmap;