import CalHeatmap from 'cal-heatmap';
//import Tooltip from 'cal-heatmap/src/plugins/tooltip';
import 'cal-heatmap/cal-heatmap.css';
import { ActivityData } from './types';
import React, {useEffect, useState } from "react";



const Heatmap: React.FC<{ data: ActivityData }> = ({ data }) => {
    const [cal, setCal] = useState<CalHeatmap | null>(null);

    useEffect(() => {
        const newCal = new CalHeatmap();
        setCal(newCal);
        const dataArray = Object.entries(data).map(([date, value]) => ({ date, value }));

  

        newCal.paint(
            {
                data: { source: dataArray, x: 'date', y: 'value' },
                date: { start: new Date('2024-01-01') },
                range: 12,
                scale: {
                    color: {
                        type: 'threshold',
                        range: ['#14432a', '#166b34', '#37a446', '#4dd05a'],
                        domain: [1, 3, 5],
                    },
                },
                domain: {
                    type: 'month',
                    //gutter: 4,
                    //label: { text: 'MMM', textAlign: 'start', position: 'top'  
                    //},
                },
                subDomain: { type: 'day', 
                  radius: 2, 
                  //width: 11, 
                  //height: 11, 
                  //gutter: 4 
                },
                itemSelector: '#heatmap-container',
            },
            // [
            //   [
            //     Tooltip,
            //   ],
            // ]
        );

        return () => {
            newCal.destroy();
        };
    }, [data]);

    return <div id="heatmap-container"></div>;
}

export default Heatmap;