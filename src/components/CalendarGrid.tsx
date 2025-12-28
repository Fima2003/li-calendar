"use client";

import React, { useState, useEffect } from 'react';
import { getCalendarData } from '@/services/calendarService';
import { CalendarMonthData } from '@/types/calendar';
import DayCell from './DayCell';
import StatsWidget from './StatsWidget';
import DayModal from './DayModal';
import MatrixModal from './MatrixModal';
import { useAuth } from './AuthContext';

const CalendarGrid = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarData, setCalendarData] = useState<CalendarMonthData>({});
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showMatrixModal, setShowMatrixModal] = useState(false);
    const { user, loading, logout } = useAuth();

    // Import dynamically or normally? importing normally.
    // Need to update imports at the top manually via another block or rely on auto-imports if I wasn't careful (but I am).
    // Let's assume I need to add the import.

    useEffect(() => {
        const fetchData = async () => {
            if (user) {
                const data = await getCalendarData(currentDate.getMonth(), currentDate.getFullYear(), user.uid);
                setCalendarData(data);
            }
        };
        if (!loading && user) {
            fetchData();
        }
    }, [currentDate, user, loading]);

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const renderDays = () => {
        const totalDays = daysInMonth(currentDate.getFullYear(), currentDate.getMonth());
        const startDay = firstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
        const daysArray = [];

        // Empty cells for previous month
        for (let i = 0; i < startDay; i++) {
            daysArray.push(
                <DayCell
                    key={`empty-${i}`}
                    date={new Date(currentDate.getFullYear(), currentDate.getMonth(), 0 - (startDay - 1 - i))}
                    isCurrentMonth={false}
                    onClick={() => { }}
                />
            );
        }

        // Days of current month
        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            const dateStr = date.toISOString().split('T')[0];
            const dayData = calendarData[dateStr];

            daysArray.push(
                <DayCell
                    key={i}
                    date={date}
                    data={dayData}
                    isCurrentMonth={true}
                    onClick={() => setSelectedDate(date)}
                />
            );
        }

        return daysArray;
    };

    const handleModalClose = () => {
        setSelectedDate(null);
        // Refresh data after modal closes to show updates
        const fetchData = async () => {
            if (user) {
                const data = await getCalendarData(currentDate.getMonth(), currentDate.getFullYear(), user.uid);
                setCalendarData(data);
            }
        };
        fetchData();
    };

    return (
        <div className="min-h-screen bg-neo-white p-8">
            <StatsWidget data={calendarData} />

            <div className="mb-8 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                            className="neo-button bg-white hover:bg-gray-100 px-3 py-2"
                            title="Previous Month"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 18L9 12L15 6" stroke="black" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                            className="neo-button bg-white hover:bg-gray-100 px-3 py-2"
                            title="Next Month"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 18L15 12L9 6" stroke="black" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" />
                            </svg>
                        </button>
                    </div>
                    <h1 className="text-4xl font-black uppercase text-neo-black shadow-neo-sm inline-block bg-neo-yellow px-4 py-2 border-4 border-black">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h1>
                </div>
                <div className="flex">
                    <button
                        onClick={() => setShowMatrixModal(true)}
                        className="neo-button bg-neo-blue text-white hover:brightness-110 mr-4 flex items-center gap-2"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="3" y1="9" x2="21" y2="9" />
                            <line x1="3" y1="15" x2="21" y2="15" />
                            <line x1="9" y1="3" x2="9" y2="21" />
                            <line x1="15" y1="3" x2="15" y2="21" />
                        </svg>
                        Matrix
                    </button>
                    <button
                        onClick={logout}
                        className="neo-button bg-neo-pink text-white hover:brightness-110"
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 border-t-4 border-l-4 border-neo-black bg-white shadow-neo-lg">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-4 border-r-4 border-b-4 border-neo-black font-bold uppercase bg-neo-yellow text-center">
                        {day}
                    </div>
                ))}
                {renderDays()}
            </div>

            {/* Legend */}
            <div className="mt-8 flex flex-wrap gap-6 justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-neo-white border-2 border-black"></div>
                    <span className="font-bold text-lg">&mdash;</span>
                    <span className="font-bold">Choose Topic</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-neo-yellow border-2 border-black"></div>
                    <span className="font-bold text-lg">&mdash;</span>
                    <span className="font-bold">Think of text</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-neo-blue border-2 border-black"></div>
                    <span className="font-bold text-lg">&mdash;</span>
                    <span className="font-bold">Polish text</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-neo-pink border-2 border-black"></div>
                    <span className="font-bold text-lg">&mdash;</span>
                    <span className="font-bold">Schedule</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-neo-green border-2 border-black"></div>
                    <span className="font-bold text-lg">&mdash;</span>
                    <span className="font-bold">Post</span>
                </div>
            </div>

            {selectedDate && (
                <DayModal
                    date={selectedDate}
                    initialData={calendarData[selectedDate.toISOString().split('T')[0]]}
                    onClose={handleModalClose}
                />
            )}

            {/* Matrix Modal */}
            {showMatrixModal && (
                <MatrixModal onClose={() => setShowMatrixModal(false)} />
            )}
        </div>
    );
};

export default CalendarGrid;
