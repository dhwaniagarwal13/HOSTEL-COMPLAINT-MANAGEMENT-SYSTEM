import { useState, useEffect } from 'react';

export default function SLATimer({ deadline }) {
    const [timeLeft, setTimeLeft] = useState('');
    const [isOverdue, setIsOverdue] = useState(false);

    useEffect(() => {
        if (!deadline) return;

        const targetDate = new Date(deadline).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const difference = targetDate - now;

            if (difference <= 0) {
                setIsOverdue(true);
                setTimeLeft('Overdue');
                return;
            }

            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            // Calculate optional days if > 24 hours
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            
            let timeString = '';
            if (days > 0) timeString += `${days}d `;
            timeString += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            setTimeLeft(timeString);
            setIsOverdue(false);
        };

        updateTimer(); // run initially
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [deadline]);

    if (!deadline) return <span className="text-gray-500 text-xs">No SLA</span>;

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${isOverdue ? 'bg-red-500/20 text-red-500 border-red-500/50' : 'bg-gray-800 text-gray-300 border-gray-600'}`}>
            ⏱ {timeLeft}
        </span>
    );
}
