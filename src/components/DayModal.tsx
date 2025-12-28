import React, { useState, useEffect } from 'react';
import { DayData, Status, PostFormat, PostRule } from '@/types/calendar';
import { updateDay } from '@/services/calendarService';
import { getMatrix, recordCellUsage } from '@/services/matrixService';
import MatrixModal from './MatrixModal';
import { useAuth } from './AuthContext';

interface DayModalProps {
    date: Date;
    initialData?: DayData;
    onClose: () => void;
}

const DayModal: React.FC<DayModalProps> = ({ date, initialData, onClose }) => {
    const [data, setData] = useState<DayData>(initialData || { date: date.toISOString().split('T')[0], status: Status.CHOOSE_TOPIC });
    const [loading, setLoading] = useState(false);
    const [showMatrixSelect, setShowMatrixSelect] = useState(false);
    const { user } = useAuth();

    // States for the wizard flow
    // "Choose Topic" -> "Think of text" -> "Polish text" -> "Schedule" -> "Post"

    const statusOrder = [
        Status.CHOOSE_TOPIC,
        Status.THINK_OF_TEXT,
        Status.POLISH_TEXT,
        Status.SCHEDULE,
        Status.POST
    ];

    const currentStatusIndex = statusOrder.indexOf(data.status);
    const isPostLocked = data.status === Status.POST;

    const handleSave = async (newData: DayData) => {
        // Optimistic update
        setData(newData);
        setLoading(true);
        if (user) {
            await updateDay(newData, user.uid);
        }
        setLoading(false);
    };

    const canAdvance = () => {
        switch (data.status) {
            case Status.CHOOSE_TOPIC:
                return !!data.topic && data.topic.trim().length > 0;
            case Status.THINK_OF_TEXT:
                return !!data.notes && data.notes.trim().length > 0;
            case Status.POLISH_TEXT:
                return !!data.finalText && data.finalText.trim().length > 0;
            case Status.SCHEDULE:
                // Already checked finalText in previous step, but good to be safe
                return !!data.finalText && data.finalText.trim().length > 0;
            default:
                return true;
        }
    };

    const advanceStatus = async () => {
        if (currentStatusIndex < statusOrder.length - 1 && canAdvance()) {
            const nextStatus = statusOrder[currentStatusIndex + 1];
            const newData = { ...data, status: nextStatus };

            // If advancing to POST and there's a matrix reference, record usage
            if (nextStatus === Status.POST && data.matrixReference && user) {
                const { rowIndex, colIndex } = data.matrixReference;
                await recordCellUsage(user.uid, rowIndex, colIndex, data.date);
            }

            handleSave(newData);
        }
    };

    const retreatStatus = () => {
        if (currentStatusIndex > 0 && !isPostLocked) {
            const prevStatus = statusOrder[currentStatusIndex - 1];
            handleSave({ ...data, status: prevStatus });
        }
    };

    const handleChange = (field: keyof DayData, value: any) => {
        const newData = { ...data, [field]: value };
        setData(newData); // Immediate UI update
        // We can debounce saving if needed, but for now just dont await
        if (user) {
            updateDay(newData, user.uid);
        }
    };

    // Sync from Matrix if referenced and not posted
    useEffect(() => {
        const syncMatrixData = async () => {
            if (user && data.matrixReference && data.status !== Status.POST) {
                const matrix = await getMatrix(user.uid);
                if (matrix && matrix.cells) {
                    const { rowIndex, colIndex } = data.matrixReference;
                    const cellValue = matrix.cells[rowIndex]?.[colIndex];
                    if (cellValue && cellValue !== data.topic) {
                        handleChange('topic', cellValue);
                    }
                }
            }
        };
        syncMatrixData();
    }, [user, data.matrixReference, data.status]); // Depend on reference to re-sync
    // Note: To be truly "live", we might need a listener, but fetching on mount/update is likely sufficient for this MVP.

    const handleMatrixSelect = (rowIndex: number, colIndex: number, text: string) => {
        const newData = {
            ...data,
            topic: text,
            matrixReference: { rowIndex, colIndex }
        };
        handleSave(newData);
        setShowMatrixSelect(false);
    };

    const handleDereference = () => {
        const newData = { ...data, matrixReference: null };
        handleSave(newData);
    };

    const renderContent = () => {
        switch (data.status) {
            case Status.CHOOSE_TOPIC:
                return (
                    <div>
                        <label className="block font-bold mb-2">Topic {!canAdvance() && <span className="text-neo-red text-xs ml-2">(Required)</span>}</label>
                        <div className="flex gap-2">
                            {data.matrixReference ? (
                                <div className="flex-1 flex items-center neo-input bg-gray-100 text-gray-500 italic relative group">
                                    <span className="truncate pr-8">Linked: {data.topic}</span>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-10 pointer-events-none">
                                        {/* Hover effect? */}
                                    </div>
                                    <button
                                        onClick={handleDereference}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-700"
                                        title="Unlink from Matrix"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    className="neo-input w-full flex-1"
                                    value={data.topic || ''}
                                    onChange={(e) => handleChange('topic', e.target.value)}
                                    placeholder="What is this post about?"
                                />
                            )}

                            {!data.matrixReference && (
                                <button
                                    onClick={() => setShowMatrixSelect(true)}
                                    className="neo-button bg-neo-pink px-4 flex items-center justify-center"
                                    title="Choose from Matrix"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="3" y1="9" x2="21" y2="9"></line>
                                        <line x1="3" y1="15" x2="21" y2="15"></line>
                                        <line x1="9" y1="3" x2="9" y2="21"></line>
                                        <line x1="15" y1="3" x2="15" y2="21"></line>
                                    </svg>
                                </button>
                            )}
                        </div>
                        {data.matrixReference && <div className="text-xs text-gray-500 mt-1">This topic is linked to the Content Matrix.</div>}
                    </div>
                );
            case Status.THINK_OF_TEXT:
                return (
                    <div>
                        <label className="block font-bold mb-2">Sketches / Notes {!canAdvance() && <span className="text-neo-red text-xs ml-2">(Required)</span>}</label>
                        <textarea
                            className="neo-input w-full h-32"
                            value={data.notes || ''}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            placeholder="Draft your thoughts..."
                        />
                    </div>
                );
            case Status.POLISH_TEXT:
                return (
                    <div>
                        <label className="block font-bold mb-2">Final Text {!canAdvance() && <span className="text-neo-red text-xs ml-2">(Required)</span>}</label>
                        <textarea
                            className="neo-input w-full h-48"
                            value={data.finalText || ''}
                            onChange={(e) => handleChange('finalText', e.target.value)}
                            placeholder="Polish it up!"
                        />
                    </div>
                );
            case Status.SCHEDULE:
                return (
                    <div>
                        <div className="bg-neo-yellow p-4 border-4 border-black mb-4 font-bold">
                            Ready to Schedule?
                        </div>
                        <p className="mb-2">Final Text Review:</p>
                        <div className="neo-box p-4 bg-gray-50 mb-4 whitespace-pre-wrap">
                            {data.finalText || "No text yet."}
                        </div>
                    </div>
                );
            case Status.POST:
                return (
                    <div>
                        <div className="bg-neo-green p-4 border-4 border-black mb-4 font-bold">
                            POSTED / LOCKED
                        </div>
                        <p className="mb-2">Final Content:</p>
                        <div className="neo-box p-4 bg-gray-50 mb-4 whitespace-pre-wrap">
                            {data.finalText}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    // Auto-save on unmount or close? No, let's rely on Explicit "Next" or specific inputs.
    // Actually requirement says "All of the data should be stored, so I can move forwards and backwards without losing any data."
    // So maybe a save on any change? For simplicity, I'll add a "Save" button or save on navigation.
    // Let's save on navigation.

    // But we need rule and format selectors always available (except locked?)
    // "Rule: 70% | 20% | 10%. Select one per post. ... Format: ... Select one per post."
    // These seem distinct from the status flow but tied to the day.

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white border-4 border-neo-black shadow-neo-lg w-full h-full sm:h-auto sm:max-w-2xl p-4 sm:p-6 relative sm:max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black uppercase bg-neo-pink inline-block px-2 border-2 border-black">
                            {date.toDateString()}
                        </h2>
                        <div className="mt-2 flex gap-2">
                            <span className="text-xs sm:text-sm font-bold bg-neo-blue border-2 border-black px-2 py-0.5">
                                {data.status}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="neo-button bg-neo-red leading-none min-w-[44px] min-h-[44px] flex items-center justify-center">X</button>
                </div>

                {/* Format & Rule Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 border-2 border-black">
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Format</label>
                        <select
                            className="neo-input w-full"
                            value={data.format || ''}
                            onChange={(e) => handleChange('format', e.target.value as PostFormat)}
                            disabled={isPostLocked}
                        >
                            <option value="">Select Format</option>
                            {Object.values(PostFormat).map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Rule</label>
                        <select
                            className="neo-input w-full"
                            value={data.rule || ''}
                            onChange={(e) => handleChange('rule', e.target.value as PostRule)}
                            disabled={isPostLocked}
                        >
                            <option value="">Select Rule</option>
                            {Object.values(PostRule).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="mb-8 min-h-[200px]">
                    {renderContent()}
                </div>

                {/* Navigation Actions */}
                <div className="flex justify-between items-center border-t-4 border-black pt-4">
                    <button
                        onClick={retreatStatus}
                        disabled={currentStatusIndex === 0 || isPostLocked}
                        className="neo-button bg-gray-200 disabled:opacity-50"
                    >
                        Back
                    </button>

                    <div className="flex gap-2">
                        {!isPostLocked && (
                            <button
                                onClick={() => handleSave(data)}
                                className="neo-button bg-neo-blue"
                            >
                                Save
                            </button>
                        )}

                        {currentStatusIndex < statusOrder.length - 1 && (
                            <button
                                onClick={advanceStatus}
                                disabled={!canAdvance()}
                                className="neo-button bg-neo-yellow disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next: {statusOrder[currentStatusIndex + 1]}
                            </button>
                        )}
                    </div>
                </div>
            </div>
            {showMatrixSelect && (
                <MatrixModal
                    onClose={() => setShowMatrixSelect(false)}
                    mode="select"
                    onSelect={handleMatrixSelect}
                />
            )}
        </div>
    );
};

export default DayModal;
